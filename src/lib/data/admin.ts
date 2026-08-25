import "server-only";

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
