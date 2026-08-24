import {
  CalendarDays,
  CheckCircle2,
  Download,
  ExternalLink,
  Globe,
  MapPin,
  Ticket,
} from "lucide-react";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { notFound } from "next/navigation";

import { EventCard } from "@/components/events/event-card";
import { FadeIn } from "@/components/shared/fade-in";
import { ShareButton } from "@/components/shared/share-button";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  eventFormatLabels,
  eventTypeLabels,
  formatDate,
  formatDateRange,
  formatTimeRange,
} from "@/lib/format";
import { getEventBySlug, getEventSources, getRelatedEvents } from "@/lib/data/events";

export const revalidate = 120;

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/events/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const event = await getEventBySlug(slug);
  if (!event) return {};

  const description = event.description.slice(0, 155);

  return {
    title: event.title,
    description,
    alternates: { canonical: `/events/${event.slug}` },
    openGraph: {
      title: event.title,
      description,
      type: "article",
      url: `${SITE_URL}/events/${event.slug}`,
    },
  };
}

export default async function EventDetailPage({
  params,
}: PageProps<"/[locale]/events/[slug]">) {
  const { slug, locale } = await params;
  setRequestLocale(locale);
  const event = await getEventBySlug(slug);
  if (!event) notFound();

  const [sources, relatedEvents] = await Promise.all([
    getEventSources(event.id),
    getRelatedEvents(event),
  ]);

  const [t, tCommon, tNav, tEventTypes, tEventFormats] = await Promise.all([
    getTranslations("eventDetail"),
    getTranslations("common"),
    getTranslations("nav"),
    getTranslations("eventTypes"),
    getTranslations("eventFormats"),
  ]);
  const EVENT_TYPE_LABELS = eventTypeLabels(tEventTypes);
  const EVENT_FORMAT_LABELS = eventFormatLabels(tEventFormats);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Event",
    name: event.title,
    startDate: event.start_date,
    endDate: event.end_date,
    eventAttendanceMode:
      event.format === "online"
        ? "https://schema.org/OnlineEventAttendanceMode"
        : event.format === "hybrid"
          ? "https://schema.org/MixedEventAttendanceMode"
          : "https://schema.org/OfflineEventAttendanceMode",
    eventStatus: "https://schema.org/EventScheduled",
    location:
      event.format === "online"
        ? { "@type": "VirtualLocation", url: event.official_url }
        : {
            "@type": "Place",
            name: event.venue ?? event.city ?? event.country,
            address: {
              "@type": "PostalAddress",
              addressLocality: event.city ?? undefined,
              addressCountry: event.country,
            },
          },
    organizer: { "@type": "Organization", name: event.organizer, url: event.official_url },
    description: event.description,
    url: `${SITE_URL}/events/${event.slug}`,
    inLanguage: locale,
  };

  const timeRange = formatTimeRange(event.start_time, event.end_time, locale);

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <nav aria-label={tNav("primaryLabel")} className="text-sm text-muted-foreground">
        <Link href="/events" className="hover:text-foreground">
          {tNav("events")}
        </Link>
        <span className="mx-1.5">/</span>
        <span className="text-foreground">{event.title}</span>
      </nav>

      <FadeIn>
        <div className="mt-4 flex flex-wrap items-center gap-1.5">
          <Badge variant="secondary">{EVENT_TYPE_LABELS[event.event_type]}</Badge>
          <Badge variant="outline">{EVENT_FORMAT_LABELS[event.format]}</Badge>
          {event.is_featured && (
            <Badge className="bg-accent text-accent-foreground">{tCommon("featured")}</Badge>
          )}
        </div>

        <h1 className="mt-3 font-heading text-3xl font-semibold leading-tight text-foreground sm:text-4xl">
          {event.title}
        </h1>

        <dl className="mt-6 grid grid-cols-1 gap-4 rounded-xl border border-border bg-card p-5 sm:grid-cols-2">
          <div className="flex gap-2.5">
            <CalendarDays className="mt-0.5 size-4.5 shrink-0 text-primary" aria-hidden="true" />
            <div>
              <dt className="text-xs font-medium text-muted-foreground">{t("dateLabel")}</dt>
              <dd className="text-sm text-foreground">
                {formatDateRange(event.start_date, event.end_date, locale)} ({event.timezone})
              </dd>
              {timeRange && (
                <dd className="mt-0.5 text-xs text-muted-foreground">{timeRange}</dd>
              )}
              {event.date_note && (
                <dd className="mt-0.5 text-xs text-muted-foreground">{event.date_note}</dd>
              )}
            </div>
          </div>
          <div className="flex gap-2.5">
            <MapPin className="mt-0.5 size-4.5 shrink-0 text-primary" aria-hidden="true" />
            <div>
              <dt className="text-xs font-medium text-muted-foreground">{t("locationLabel")}</dt>
              <dd className="text-sm text-foreground">
                {[event.venue, event.city, event.country].filter(Boolean).join(", ")}
              </dd>
            </div>
          </div>
          <div className="flex gap-2.5">
            <Globe className="mt-0.5 size-4.5 shrink-0 text-primary" aria-hidden="true" />
            <div>
              <dt className="text-xs font-medium text-muted-foreground">
                {t("organizerLabel")}
              </dt>
              <dd className="text-sm text-foreground">{event.organizer}</dd>
            </div>
          </div>
          <div className="flex gap-2.5">
            <CheckCircle2 className="mt-0.5 size-4.5 shrink-0 text-primary" aria-hidden="true" />
            <div>
              <dt className="text-xs font-medium text-muted-foreground">
                {t("lastVerifiedLabel")}
              </dt>
              <dd className="text-sm text-foreground">
                {formatDate(event.last_verified_at, locale)}
              </dd>
            </div>
          </div>
        </dl>

        <div className="mt-6 flex flex-wrap gap-3">
          <Button asChild>
            <a href={event.official_url} target="_blank" rel="noopener noreferrer">
              {t("officialSite")}
              <ExternalLink className="size-4" aria-hidden="true" />
            </a>
          </Button>
          {event.registration_url && (
            <Button variant="outline" asChild>
              <a href={event.registration_url} target="_blank" rel="noopener noreferrer">
                <Ticket className="size-4" aria-hidden="true" />
                {t("register")}
              </a>
            </Button>
          )}
          <Button variant="outline" asChild>
            <a href={`/events/${event.slug}/ics`} download>
              <Download className="size-4" aria-hidden="true" />
              {t("addToCalendar")}
            </a>
          </Button>
          <ShareButton title={event.title} url={`${SITE_URL}/events/${event.slug}`} />
        </div>

        <div className="prose prose-neutral dark:prose-invert mt-10 max-w-none">
          <h2 className="font-heading text-xl font-semibold text-foreground">
            {t("aboutHeading")}
          </h2>
          <p className="whitespace-pre-line text-muted-foreground">{event.description}</p>
        </div>

        {event.topics.length > 0 && (
          <div className="mt-6">
            <h2 className="text-sm font-semibold text-foreground">{t("topicsHeading")}</h2>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {event.topics.map((topic) => (
                <Badge key={topic} variant="secondary">
                  {topic}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {sources.length > 0 && (
          <div className="mt-10 rounded-xl border border-border bg-secondary/30 p-5">
            <h2 className="text-sm font-semibold text-foreground">{t("sourcesHeading")}</h2>
            <ul className="mt-2 space-y-1.5">
              {sources.map((source) => (
                <li key={source.id} className="text-sm">
                  <a
                    href={source.source_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline"
                  >
                    {source.source_name}
                  </a>
                  <span className="text-muted-foreground">
                    {" "}
                    {t("sourceCheckedOn", {
                      date: formatDate(source.fetched_at.slice(0, 10), locale),
                    })}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </FadeIn>

      {relatedEvents.length > 0 && (
        <section className="mt-14">
          <h2 className="font-heading text-xl font-semibold text-foreground">
            {t("relatedHeading")}
          </h2>
          <ul className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {relatedEvents.map((related) => (
              <li key={related.id}>
                <EventCard event={related} />
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
