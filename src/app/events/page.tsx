import { CalendarX2 } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { EventCard } from "@/components/events/event-card";
import { EventFilters } from "@/components/events/event-filters";
import { FadeIn } from "@/components/shared/fade-in";
import { Button } from "@/components/ui/button";
import { searchEvents } from "@/lib/data/events";
import { eventSearchSchema } from "@/lib/validation/event";

export const metadata: Metadata = {
  title: "Spine Surgery Congresses in Latin America",
  description:
    "Search and filter upcoming spine surgery congresses, courses, workshops, and webinars across Latin America by country, date, format, and topic.",
};

export default async function EventsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const rawParams = await searchParams;
  const parsed = eventSearchSchema.safeParse({
    q: rawParams.q,
    country: rawParams.country,
    eventType: rawParams.eventType,
    format: rawParams.format,
    topic: rawParams.topic,
    from: rawParams.from,
    to: rawParams.to,
    sort: rawParams.sort,
    page: rawParams.page,
  });

  const filters = parsed.success ? parsed.data : eventSearchSchema.parse({});
  const { events, total, page, pageSize } = await searchEvents(filters);
  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="max-w-2xl">
        <h1 className="font-heading text-3xl font-semibold text-foreground sm:text-4xl">
          Spine surgery congresses across Latin America
        </h1>
        <p className="mt-2 text-muted-foreground">
          {total} {total === 1 ? "event" : "events"} verified from official sources.
        </p>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-[280px_1fr]">
        <aside className="lg:sticky lg:top-20 lg:self-start">
          <EventFilters />
        </aside>

        <div>
          {events.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border p-12 text-center">
              <CalendarX2 className="mx-auto size-10 text-muted-foreground" aria-hidden="true" />
              <h2 className="mt-4 font-heading text-xl font-semibold text-foreground">
                No congresses match your filters
              </h2>
              <p className="mt-2 text-muted-foreground">
                Try widening your date range or clearing a filter.
              </p>
              <Button variant="outline" className="mt-5" asChild>
                <Link href="/events">Clear all filters</Link>
              </Button>
            </div>
          ) : (
            <>
              <ul className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {events.map((event, i) => (
                  <FadeIn as="li" delay={i * 0.03} key={event.id}>
                    <EventCard event={event} />
                  </FadeIn>
                ))}
              </ul>

              {totalPages > 1 && (
                <nav
                  aria-label="Pagination"
                  className="mt-10 flex items-center justify-center gap-3"
                >
                  <Button variant="outline" disabled={page <= 1} asChild={page > 1}>
                    {page > 1 ? (
                      <Link href={buildPageHref(rawParams, page - 1)}>Previous</Link>
                    ) : (
                      <span>Previous</span>
                    )}
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    Page {page} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    disabled={page >= totalPages}
                    asChild={page < totalPages}
                  >
                    {page < totalPages ? (
                      <Link href={buildPageHref(rawParams, page + 1)}>Next</Link>
                    ) : (
                      <span>Next</span>
                    )}
                  </Button>
                </nav>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function buildPageHref(
  rawParams: Record<string, string | string[] | undefined>,
  page: number,
): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(rawParams)) {
    if (typeof value === "string" && key !== "page") params.set(key, value);
  }
  params.set("page", String(page));
  return `/events?${params.toString()}`;
}
