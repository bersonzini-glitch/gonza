import { CalendarSearch, MapPinned, ShieldCheck, Sparkles } from "lucide-react";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";

import { EventCard } from "@/components/events/event-card";
import { FadeIn } from "@/components/shared/fade-in";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { eventFormatLabels, formatDateRange } from "@/lib/format";
import { getDistinctCountries, getFeaturedEvent, getUpcomingEvents } from "@/lib/data/events";

export const revalidate = 60;

export async function generateMetadata({
  params,
}: PageProps<"/[locale]">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "home" });
  return { title: t("metaTitle") };
}

export default async function HomePage({ params }: PageProps<"/[locale]">) {
  const { locale } = await params;
  setRequestLocale(locale);

  const [upcomingEvents, featuredEvent, countries, t, tEventFormats] = await Promise.all([
    getUpcomingEvents(6),
    getFeaturedEvent(),
    getDistinctCountries(),
    getTranslations("home"),
    getTranslations("eventFormats"),
  ]);
  const EVENT_FORMAT_LABELS = eventFormatLabels(tEventFormats);

  return (
    <div>
      <section className="border-b border-border bg-gradient-to-b from-secondary/50 to-background">
        <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
          <FadeIn>
            <Badge variant="outline" className="mb-4 gap-1.5 border-primary/30 text-primary">
              <Sparkles className="size-3.5" aria-hidden="true" />
              {t("heroBadge")}
            </Badge>
            <h1 className="max-w-3xl font-heading text-4xl font-semibold leading-tight tracking-tight text-foreground sm:text-5xl">
              {t("heroTitle")}
            </h1>
            <p className="mt-4 max-w-2xl text-lg text-muted-foreground">{t("heroSubtitle")}</p>
          </FadeIn>

          <FadeIn delay={0.1}>
            <form
              action="/events"
              method="GET"
              role="search"
              aria-label={t("searchAriaLabel")}
              className="mt-8 flex max-w-xl flex-col gap-2 sm:flex-row"
            >
              <label htmlFor="home-search" className="sr-only">
                {t("searchLabel")}
              </label>
              <input
                id="home-search"
                name="q"
                type="search"
                placeholder={t("searchPlaceholder")}
                className="h-12 w-full rounded-lg border border-input bg-card px-4 text-sm shadow-sm outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              />
              <Button type="submit" size="lg" className="h-12 shrink-0 gap-2">
                <CalendarSearch className="size-4" aria-hidden="true" />
                {t("searchButton")}
              </Button>
            </form>
          </FadeIn>

          <FadeIn delay={0.15}>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button variant="outline" asChild>
                <Link href="/surgeons">{t("viewSurgeonDirectory")}</Link>
              </Button>
              <Button variant="ghost" asChild>
                <Link href="/about">{t("howWeVerify")}</Link>
              </Button>
            </div>
          </FadeIn>
        </div>
      </section>

      {featuredEvent && (
        <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <FadeIn>
            <Link
              href={`/events/${featuredEvent.slug}`}
              className="group grid grid-cols-1 gap-6 rounded-2xl border border-primary/20 bg-accent/40 p-6 transition-colors hover:bg-accent/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:p-10 md:grid-cols-[1fr_auto] md:items-center"
            >
              <div>
                <Badge className="mb-3 bg-primary text-primary-foreground">
                  {t("featuredEventBadge")}
                </Badge>
                <h2 className="font-heading text-2xl font-semibold text-foreground sm:text-3xl">
                  {featuredEvent.title}
                </h2>
                <p className="mt-2 text-muted-foreground">
                  {formatDateRange(featuredEvent.start_date, featuredEvent.end_date, locale)} ·{" "}
                  {[featuredEvent.city, featuredEvent.country].filter(Boolean).join(", ")} ·{" "}
                  {EVENT_FORMAT_LABELS[featuredEvent.format]}
                </p>
              </div>
              <Button className="w-fit" size="lg">
                {t("viewDetails")}
              </Button>
            </Link>
          </FadeIn>
        </section>
      )}

      <section className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between gap-4">
          <h2 className="font-heading text-2xl font-semibold text-foreground">
            {t("upcomingHeading")}
          </h2>
          <Link href="/events" className="text-sm font-medium text-primary hover:underline">
            {t("viewAll")}
          </Link>
        </div>

        {upcomingEvents.length === 0 ? (
          <div className="mt-8 rounded-xl border border-dashed border-border p-10 text-center text-muted-foreground">
            <CalendarSearch className="mx-auto size-8" aria-hidden="true" />
            <p className="mt-3">{t("noEventsYet")}</p>
          </div>
        ) : (
          <ul className="mt-8 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {upcomingEvents.map((event, i) => (
              <FadeIn as="li" delay={i * 0.04} key={event.id}>
                <EventCard event={event} />
              </FadeIn>
            ))}
          </ul>
        )}
      </section>

      {countries.length > 0 && (
        <section className="border-y border-border bg-secondary/30">
          <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
            <h2 className="flex items-center gap-2 font-heading text-2xl font-semibold text-foreground">
              <MapPinned className="size-5 text-primary" aria-hidden="true" />
              {t("exploreByCountry")}
            </h2>
            <div className="mt-6 flex flex-wrap gap-2">
              {countries.map((country) => (
                <Link key={country} href={`/events?country=${encodeURIComponent(country)}`}>
                  <Badge
                    variant="outline"
                    className="cursor-pointer px-3 py-1.5 text-sm transition-colors hover:border-primary hover:text-primary"
                  >
                    {country}
                  </Badge>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
          <div>
            <h2 className="flex items-center gap-2 font-heading text-2xl font-semibold text-foreground">
              <ShieldCheck className="size-5 text-primary" aria-hidden="true" />
              {t("dataSourcesHeading")}
            </h2>
            <p className="mt-3 max-w-lg text-muted-foreground">{t("dataSourcesBody")}</p>
            <Button variant="outline" className="mt-5" asChild>
              <Link href="/about">{t("readMethodology")}</Link>
            </Button>
          </div>
          <div>
            <h2 className="font-heading text-2xl font-semibold text-foreground">
              {t("verifiedDirectoryHeading")}
            </h2>
            <p className="mt-3 max-w-lg text-muted-foreground">
              {t("verifiedDirectoryBody")}
            </p>
            <Button variant="outline" className="mt-5" asChild>
              <Link href="/surgeons">{t("exploreDirectory")}</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
