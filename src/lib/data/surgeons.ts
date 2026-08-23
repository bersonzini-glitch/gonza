import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { SurgeonSearchInput } from "@/lib/validation/surgeon";
import type { Database } from "@/types/database";

export type SurgeonProfileRow = Database["public"]["Tables"]["surgeon_profiles"]["Row"];
export type SurgeonSpecialtyRow = Database["public"]["Tables"]["surgeon_specialties"]["Row"];
export type SurgeonLocationRow = Database["public"]["Tables"]["surgeon_locations"]["Row"];

export type SurgeonWithRelations = SurgeonProfileRow & {
  surgeon_specialties: SurgeonSpecialtyRow[];
  surgeon_locations: SurgeonLocationRow[];
};

const PAGE_SIZE = 12;

export interface SurgeonSearchResult {
  surgeons: SurgeonWithRelations[];
  total: number;
  page: number;
  pageSize: number;
}

export async function searchSurgeons(filters: SurgeonSearchInput): Promise<SurgeonSearchResult> {
  const supabase = await createClient();

  let query = supabase
    .from("surgeon_profiles")
    .select("*, surgeon_specialties(*), surgeon_locations(*)", { count: "exact" })
    .eq("status", "approved");

  if (filters.q) {
    const term = filters.q.trim();
    query = query.or(`full_name.ilike.%${term}%,bio.ilike.%${term}%`);
  }

  if (filters.specialty) query = query.eq("primary_specialty", filters.specialty);
  if (filters.language) query = query.contains("languages", [filters.language]);
  if (filters.inPerson) query = query.eq("in_person_available", true);
  if (filters.telemedicine) query = query.eq("telemedicine_available", true);

  query = query.order("full_name", { ascending: true });

  const from = (filters.page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;
  query = query.range(from, to);

  const { data, error, count } = await query;

  if (error) throw new Error(`Failed to search surgeons: ${error.message}`);

  let surgeons = (data ?? []) as unknown as SurgeonWithRelations[];

  // Country/city/subspecialty filter on the joined tables — applied
  // in-memory because PostgREST can't filter a parent row by a nested
  // relation's column directly through this query shape.
  if (filters.country) {
    surgeons = surgeons.filter((s) =>
      s.surgeon_locations.some((l) => l.country === filters.country),
    );
  }
  if (filters.city) {
    surgeons = surgeons.filter((s) => s.surgeon_locations.some((l) => l.city === filters.city));
  }
  if (filters.subspecialty) {
    surgeons = surgeons.filter((s) =>
      s.surgeon_specialties.some((sp) => sp.specialty === filters.subspecialty),
    );
  }

  return { surgeons, total: count ?? 0, page: filters.page, pageSize: PAGE_SIZE };
}

export async function getSurgeonBySlug(slug: string): Promise<SurgeonWithRelations | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("surgeon_profiles")
    .select("*, surgeon_specialties(*), surgeon_locations(*)")
    .eq("slug", slug)
    .maybeSingle();
  return (data as unknown as SurgeonWithRelations) ?? null;
}

export async function getOwnSurgeonProfile(userId: string): Promise<SurgeonWithRelations | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("surgeon_profiles")
    .select("*, surgeon_specialties(*), surgeon_locations(*)")
    .eq("user_id", userId)
    .maybeSingle();
  return (data as unknown as SurgeonWithRelations) ?? null;
}

export async function getDistinctSurgeonCountries(): Promise<string[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("surgeon_locations")
    .select("country, surgeon_profiles!inner(status)")
    .eq("surgeon_profiles.status", "approved");
  const set = new Set((data ?? []).map((r) => r.country));
  return Array.from(set).sort();
}
