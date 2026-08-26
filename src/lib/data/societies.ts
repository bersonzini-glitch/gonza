import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { SocietySearchInput } from "@/lib/validation/society";
import type { Database } from "@/types/database";

export type ScientificSocietyRow = Database["public"]["Tables"]["scientific_societies"]["Row"];

const PAGE_SIZE = 24;

export interface SocietySearchResult {
  societies: ScientificSocietyRow[];
  total: number;
  page: number;
  pageSize: number;
}

export async function searchSocieties(filters: SocietySearchInput): Promise<SocietySearchResult> {
  const supabase = await createClient();

  let query = supabase.from("scientific_societies").select("*", { count: "exact" });

  if (filters.q) {
    const term = filters.q.trim();
    query = query.ilike("name", `%${term}%`);
  }
  if (filters.country) query = query.eq("country", filters.country);
  if (filters.specialty) query = query.contains("specialties", [filters.specialty]);

  query = query.order("name", { ascending: true });

  const from = (filters.page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;
  query = query.range(from, to);

  const { data, error, count } = await query;
  if (error) throw new Error(`Failed to search scientific societies: ${error.message}`);

  return { societies: data ?? [], total: count ?? 0, page: filters.page, pageSize: PAGE_SIZE };
}

export async function getSocietyBySlug(slug: string): Promise<ScientificSocietyRow | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("scientific_societies")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();
  return data ?? null;
}

export async function getRelatedSocieties(
  society: ScientificSocietyRow,
  limit = 3,
): Promise<ScientificSocietyRow[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("scientific_societies")
    .select("*")
    .neq("id", society.id)
    .eq("country", society.country)
    .order("name", { ascending: true })
    .limit(limit);
  return data ?? [];
}

/**
 * Distinct countries actually present in the table, for the filter
 * dropdown — societies span far beyond LATAM (unlike events/surgeons), so
 * there's no fixed country enum to draw from. "Internacional" is pinned
 * first when present, matching how the source list treats supranational
 * bodies as their own pinned group rather than sorting them in alphabetically.
 */
export async function getDistinctSocietyCountries(): Promise<string[]> {
  const supabase = await createClient();
  const { data } = await supabase.from("scientific_societies").select("country");
  const set = new Set((data ?? []).map((r) => r.country));
  const rest = Array.from(set)
    .filter((c) => c !== "Internacional")
    .sort((a, b) => a.localeCompare(b, "es"));
  return set.has("Internacional") ? ["Internacional", ...rest] : rest;
}
