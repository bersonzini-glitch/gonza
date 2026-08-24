import "server-only";

import { createClient } from "@/lib/supabase/server";
import type { EventSearchInput } from "@/lib/validation/event";
import type { Database } from "@/types/database";

export type EventRow = Database["public"]["Tables"]["events"]["Row"];
export type EventSourceRow = Database["public"]["Tables"]["event_sources"]["Row"];

const PAGE_SIZE = 12;

export interface EventSearchResult {
  events: EventRow[];
  total: number;
  page: number;
  pageSize: number;
}

/**
 * Applies the shared search/filter/sort logic for the public events feed.
 * Only ever touches rows visible under RLS (status = 'approved' for the
 * anon/authenticated caller).
 */
export async function searchEvents(filters: EventSearchInput): Promise<EventSearchResult> {
  const supabase = await createClient();

  let query = supabase.from("events").select("*", { count: "exact" });

  if (filters.q) {
    const term = filters.q.trim();
    query = query.or(
      `title.ilike.%${term}%,organizer.ilike.%${term}%,city.ilike.%${term}%,country.ilike.%${term}%`,
    );
  }

  if (filters.country) query = query.eq("country", filters.country);
  if (filters.eventType) query = query.eq("event_type", filters.eventType);
  if (filters.format) query = query.eq("format", filters.format);
  if (filters.topic) query = query.contains("topics", [filters.topic]);
  if (filters.from) query = query.gte("start_date", filters.from);
  if (filters.to) query = query.lte("start_date", filters.to);
  // Past congresses stay out of the default feed — "soonest first" should
  // actually mean the nearest one still ahead, not the oldest one behind.
  // Combines with an explicit `from` via AND, so a future `from` still
  // narrows further and a past `from` typed without opting into past
  // events just yields no results instead of surfacing old ones.
  if (!filters.includePast) {
    const today = new Date().toISOString().slice(0, 10);
    query = query.gte("start_date", today);
  }

  switch (filters.sort) {
    case "alphabetical":
      query = query.order("title", { ascending: true });
      break;
    case "recently_added":
      query = query.order("created_at", { ascending: false });
      break;
    case "soonest":
    default:
      query = query.order("start_date", { ascending: true });
      break;
  }

  const from = (filters.page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;
  query = query.range(from, to);

  const { data, error, count } = await query;

  if (error) throw new Error(`Failed to search events: ${error.message}`);

  return { events: data ?? [], total: count ?? 0, page: filters.page, pageSize: PAGE_SIZE };
}

export async function getUpcomingEvents(limit = 6): Promise<EventRow[]> {
  const supabase = await createClient();
  const today = new Date().toISOString().slice(0, 10);

  const { data, error } = await supabase
    .from("events")
    .select("*")
    .gte("start_date", today)
    .order("start_date", { ascending: true })
    .limit(limit);

  if (error) throw new Error(`Failed to load upcoming events: ${error.message}`);
  return data ?? [];
}

export async function getFeaturedEvent(): Promise<EventRow | null> {
  const supabase = await createClient();
  const today = new Date().toISOString().slice(0, 10);

  const { data } = await supabase
    .from("events")
    .select("*")
    .eq("is_featured", true)
    .gte("start_date", today)
    .order("start_date", { ascending: true })
    .limit(1)
    .maybeSingle();

  if (data) return data;

  const { data: fallback } = await supabase
    .from("events")
    .select("*")
    .gte("start_date", today)
    .order("start_date", { ascending: true })
    .limit(1)
    .maybeSingle();

  return fallback ?? null;
}

export async function getEventBySlug(slug: string): Promise<EventRow | null> {
  const supabase = await createClient();
  const { data } = await supabase.from("events").select("*").eq("slug", slug).maybeSingle();
  return data ?? null;
}

export async function getEventSources(eventId: string): Promise<EventSourceRow[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("event_sources")
    .select("*")
    .eq("event_id", eventId)
    .order("fetched_at", { ascending: false });
  return data ?? [];
}

export async function getRelatedEvents(event: EventRow, limit = 3): Promise<EventRow[]> {
  const supabase = await createClient();
  const today = new Date().toISOString().slice(0, 10);

  const { data } = await supabase
    .from("events")
    .select("*")
    .neq("id", event.id)
    .or(`country.eq.${event.country},event_type.eq.${event.event_type}`)
    .gte("start_date", today)
    .order("start_date", { ascending: true })
    .limit(limit);

  return data ?? [];
}

export async function getDistinctCountries(): Promise<string[]> {
  const supabase = await createClient();
  const { data } = await supabase.from("events").select("country").order("country");
  const set = new Set((data ?? []).map((r) => r.country));
  return Array.from(set);
}
