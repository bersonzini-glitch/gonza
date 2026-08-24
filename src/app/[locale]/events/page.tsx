import { CalendarX2 } from "lucide-react";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";

import { EventCard } from "@/components/events/event-card";
import { EventFilters } from "@/components/events/event-filters";
import { FadeIn } from "@/components/shared/fade-in";
import { Button } from "@/components/ui/button";
import { searchEvents } from "@/lib/data/events";
import { eventSearchSchema } from "@/lib/validation/event";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/events">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "eventsPage" });
  return { title: t("metaTitle"), description: t("metaDescription") };
}

export default async function EventsPage({
  params,
  searchParams,
}: PageProps<"/[locale]/events">) {
  const { locale } = await params;
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
  const t = await getTranslations({ locale, namespace: "eventsPage" });

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="max-w-2xl">
        <h1 className="font-heading text-3xl font-semibold text-foreground sm:text-4xl">
          {t("heading")}
        </h1>
        <p className="mt-2 text-muted-foreground">{t("resultsCount", { count: total })}</p>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-[280px_1fr]">
        <aside className="lg:sticky lg:top-20 lg:self-start">
          <EventFilters />
        </aside>

        <div>
          {events.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border p-12 text-center">
              <CalendarX2 className="mx-auto size-10 text-muted-foreground" aria-hidden="true" />
              <h2 className="mt-4 font-heading text-xl font-semibold text-foreground">
                {t("emptyHeading")}
              </h2>
              <p className="mt-2 text-muted-foreground">{t("emptyBody")}</p>
              <Button variant="outline" className="mt-5" asChild>
                <Link href="/events">{t("clearFilters")}</Link>
              </Button>
            </div>
          ) : (
            <>
              <ul className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {events.map((event, i) => (
                  <FadeIn as="li" delay={i * 0.03} key={event.id}>
                    <EventCard event={event} />
                  </FadeIn>
                ))}
              </ul>

              {totalPages > 1 && (
                <nav
                  aria-label={t("paginationLabel")}
                  className="mt-10 flex items-center justify-center gap-3"
                >
                  <Button variant="outline" disabled={page <= 1} asChild={page > 1}>
                    {page > 1 ? (
                      <Link href={buildPageHref(rawParams, page - 1)}>{t("previous")}</Link>
                    ) : (
                      <span>{t("previous")}</span>
                    )}
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    {t("pageOf", { page, totalPages })}
                  </span>
                  <Button
                    variant="outline"
                    disabled={page >= totalPages}
                    asChild={page < totalPages}
                  >
                    {page < totalPages ? (
                      <Link href={buildPageHref(rawParams, page + 1)}>{t("next")}</Link>
                    ) : (
                      <span>{t("next")}</span>
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
