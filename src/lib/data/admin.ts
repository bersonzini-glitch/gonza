import "server-only";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import type { Database } from "@/types/database";
import type { SurgeonWithRelations } from "@/lib/data/surgeons";

export interface AdminOverviewMetrics {
  totalSurgeons: number;
  pendingSurgeons: number;
  approvedSurgeons: number;
  rejectedSurgeons: number;
  suspendedSurgeons: number;
  totalEvents: number;
  pendingEvents: number;
  approvedEvents: number;
}

export async function getAdminOverviewMetrics(): Promise<AdminOverviewMetrics> {
  const supabase = await createClient();

  const [surgeons, events] = await Promise.all([
    supabase.from("surgeon_profiles").select("status"),
    supabase.from("events").select("status"),
  ]);

  const surgeonRows = surgeons.data ?? [];
  const eventRows = events.data ?? [];

  return {
    totalSurgeons: surgeonRows.length,
    pendingSurgeons: surgeonRows.filter((r) => r.status === "submitted").length,
    approvedSurgeons: surgeonRows.filter((r) => r.status === "approved").length,
    rejectedSurgeons: surgeonRows.filter((r) => r.status === "rejected").length,
    suspendedSurgeons: surgeonRows.filter((r) => r.status === "suspended").length,
    totalEvents: eventRows.length,
    pendingEvents: eventRows.filter((r) => r.status === "pending").length,
    approvedEvents: eventRows.filter((r) => r.status === "approved").length,
  };
}

export interface AdminSurgeonFilters {
  status?: Database["public"]["Tables"]["surgeon_profiles"]["Row"]["status"];
  country?: string;
  specialty?: Database["public"]["Tables"]["surgeon_profiles"]["Row"]["primary_specialty"];
  q?: string;
}

export async function listSurgeonsForAdmin(
  filters: AdminSurgeonFilters,
): Promise<SurgeonWithRelations[]> {
  const supabase = await createClient();

  let query = supabase
    .from("surgeon_profiles")
    .select("*, surgeon_specialties(*), surgeon_locations(*)")
    .order("created_at", { ascending: false });

  if (filters.status) query = query.eq("status", filters.status);
  if (filters.specialty) query = query.eq("primary_specialty", filters.specialty);
  if (filters.q) query = query.ilike("full_name", `%${filters.q}%`);

  const { data } = await query;
  let surgeons = (data ?? []) as unknown as SurgeonWithRelations[];

  if (filters.country) {
    surgeons = surgeons.filter((s) =>
      s.surgeon_locations.some((l) => l.country === filters.country),
    );
  }

  return surgeons;
}

export interface UnstartedUserRow {
  id: string;
  username: string;
  full_name: string | null;
  email: string | null;
  created_at: string;
  draftSurgeonId: string | null;
}

/**
 * Accounts that signed up but never got a submitted surgeon profile —
 * either they never started one at all, or they saved a draft and stopped.
 * Invisible from listSurgeonsForAdmin() alone, since that only reads
 * surgeon_profiles rows and someone who never opened the dashboard form
 * has none. Email comes from auth.users (not exposed via RLS/PostgREST to
 * anyone, admin included), so this is one of the few call sites allowed to
 * reach for the service-role client — safe here because this function is
 * only ever called from the already-admin-gated /admin/surgeons route.
 */
export async function listUnstartedUsersForAdmin(): Promise<UnstartedUserRow[]> {
  const supabase = await createClient();

  const [{ data: profiles }, { data: surgeons }] = await Promise.all([
    supabase.from("profiles").select("id, username, full_name, created_at").eq("role", "user"),
    supabase.from("surgeon_profiles").select("id, user_id, status"),
  ]);

  const draftSurgeonIdByUser = new Map(
    (surgeons ?? []).filter((s) => s.status === "draft").map((s) => [s.user_id, s.id]),
  );
  const hasAnySurgeonProfile = new Set((surgeons ?? []).map((s) => s.user_id));

  const pending = (profiles ?? []).filter(
    (p) => !hasAnySurgeonProfile.has(p.id) || draftSurgeonIdByUser.has(p.id),
  );
  if (pending.length === 0) return [];

  const admin = createAdminClient();
  const emailById = new Map<string, string>();
  const perPage = 200;
  for (let page = 1; ; page++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage });
    if (error || !data) break;
    for (const u of data.users) if (u.email) emailById.set(u.id, u.email);
    if (data.users.length < perPage) break;
  }

  return pending
    .map((p) => ({
      id: p.id,
      username: p.username,
      full_name: p.full_name,
      email: emailById.get(p.id) ?? null,
      created_at: p.created_at,
      draftSurgeonId: draftSurgeonIdByUser.get(p.id) ?? null,
    }))
    .sort((a, b) => (a.created_at < b.created_at ? 1 : -1));
}

export interface ApprovedSurgeonEmailRow {
  id: string;
  fullName: string;
  email: string;
}

export interface ApprovedSurgeonEmailFilters {
  notifyNewEvents?: boolean;
  notifySuggestedInvitations?: boolean;
}

/**
 * Login emails (not the optional public `contact_email`) for every approved
 * surgeon, for the admin "emailing" feature — same service-role
 * auth.admin.listUsers() pattern as listUnstartedUsersForAdmin(), since
 * auth.users isn't reachable via RLS/PostgREST even to admins. The two
 * filters narrow the result to accounts that opted into that notification
 * (see profiles.notify_new_events / notify_suggested_invitations) — surgeons
 * with no matching profiles row are excluded rather than assumed opted-in.
 */
export async function listApprovedSurgeonEmailsForAdmin(
  filters: ApprovedSurgeonEmailFilters = {},
): Promise<ApprovedSurgeonEmailRow[]> {
  const supabase = await createClient();
  const { data: allSurgeons } = await supabase
    .from("surgeon_profiles")
    .select("user_id, full_name")
    .eq("status", "approved");

  if (!allSurgeons || allSurgeons.length === 0) return [];

  let surgeons = allSurgeons;
  if (filters.notifyNewEvents || filters.notifySuggestedInvitations) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, notify_new_events, notify_suggested_invitations")
      .in(
        "id",
        allSurgeons.map((s) => s.user_id),
      );
    const preferencesById = new Map((profiles ?? []).map((p) => [p.id, p]));
    surgeons = allSurgeons.filter((s) => {
      const prefs = preferencesById.get(s.user_id);
      if (!prefs) return false;
      if (filters.notifyNewEvents && !prefs.notify_new_events) return false;
      if (filters.notifySuggestedInvitations && !prefs.notify_suggested_invitations) return false;
      return true;
    });
  }

  if (surgeons.length === 0) return [];

  const admin = createAdminClient();
  const emailById = new Map<string, string>();
  const perPage = 200;
  for (let page = 1; ; page++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage });
    if (error || !data) break;
    for (const u of data.users) if (u.email) emailById.set(u.id, u.email);
    if (data.users.length < perPage) break;
  }

  return surgeons
    .map((s) => ({ id: s.user_id, fullName: s.full_name, email: emailById.get(s.user_id) ?? "" }))
    .filter((s) => s.email.length > 0);
}

export async function getSurgeonForAdmin(id: string): Promise<SurgeonWithRelations | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("surgeon_profiles")
    .select("*, surgeon_specialties(*), surgeon_locations(*)")
    .eq("id", id)
    .maybeSingle();
  return (data as unknown as SurgeonWithRelations) ?? null;
}

export async function listEventsForAdmin() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("events")
    .select("*")
    .order("start_date", { ascending: false });
  return data ?? [];
}

export type EventWithSources = Database["public"]["Tables"]["events"]["Row"] & {
  event_sources: Database["public"]["Tables"]["event_sources"]["Row"][];
};

export async function getEventForAdmin(id: string): Promise<EventWithSources | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("events")
    .select("*, event_sources(*)")
    .eq("id", id)
    .maybeSingle();
  return (data as unknown as EventWithSources) ?? null;
}

export async function listSocietiesForAdmin() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("scientific_societies")
    .select("*")
    .order("country", { ascending: true })
    .order("name", { ascending: true });
  return data ?? [];
}

export async function getSocietyForAdmin(id: string) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("scientific_societies")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  return data;
}

export async function listAuditLogs(limit = 100) {
  const supabase = await createClient();
  const { data } = await supabase
    .from("admin_audit_logs")
    .select("*, profiles(username)")
    .order("created_at", { ascending: false })
    .limit(limit);
  return data ?? [];
}

export interface LatestAiEventSearchRun {
  status: "started" | "completed" | "failed";
  createdAt: string;
  metadata: Record<string, unknown>;
}

/**
 * Reads only the single most recent AI-event-search audit entry, used to
 * show a status banner ("búsqueda en curso" / "se agregaron N eventos" /
 * "falló") on the admin events page. The three actions
 * (ai_event_search_started/completed/failed) are logged by
 * triggerAiEventSearchAction() in lib/actions/admin.ts — whichever is
 * newest tells us the state of the last run.
 */
export async function getLatestAiEventSearchRun(): Promise<LatestAiEventSearchRun | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("admin_audit_logs")
    .select("action, created_at, metadata")
    .in("action", ["ai_event_search_started", "ai_event_search_completed", "ai_event_search_failed"])
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!data) return null;

  return {
    status: data.action.replace("ai_event_search_", "") as LatestAiEventSearchRun["status"],
    createdAt: data.created_at,
    metadata: data.metadata,
  };
}
