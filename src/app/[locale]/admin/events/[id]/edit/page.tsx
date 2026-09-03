import { ExternalLink } from "lucide-react";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";

import { DeleteEventButton } from "@/components/admin/delete-event-button";
import { EventForm } from "@/components/admin/event-form";
import { NotifyInterestedSurgeonsButton } from "@/components/admin/notify-interested-surgeons-button";
import { Button } from "@/components/ui/button";
import { updateEventAction } from "@/lib/actions/admin";
import { getEventForAdmin } from "@/lib/data/admin";
import { localizedPath } from "@/lib/hreflang";
import type { EventInput } from "@/lib/validation/event";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/admin/events/[id]/edit">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "eventForm" });
  return { title: t("metaTitleEdit") };
}

export const dynamic = "force-dynamic";

export default async function EditEventPage({
  params,
}: PageProps<"/[locale]/admin/events/[id]/edit">) {
  const { id, locale } = await params;
  const event = await getEventForAdmin(id);
  if (!event) notFound();
  const t = await getTranslations({ locale, namespace: "eventForm" });

  const defaultValues: EventInput = {
    title: event.title,
    slug: event.slug,
    description: event.description,
    eventType: event.event_type,
    format: event.format,
    language: event.language,
    status: event.status,
    isFeatured: event.is_featured,
    startDate: event.start_date,
    endDate: event.end_date,
    startTime: event.start_time ?? "",
    endTime: event.end_time ?? "",
    dateNote: event.date_note ?? "",
    timezone: event.timezone,
    country: event.country,
    city: event.city ?? "",
    venue: event.venue ?? "",
    organizer: event.organizer,
    topics: event.topics,
    officialUrl: event.official_url,
    registrationUrl: event.registration_url ?? "",
    sourceUrl: event.source_url,
    lastVerifiedAt: event.last_verified_at,
    sources:
      event.event_sources.length > 0
        ? event.event_sources.map((s) => ({
            sourceName: s.source_name,
            sourceUrl: s.source_url,
            sourceType: s.source_type,
            notes: s.notes ?? "",
          }))
        : [{ sourceName: "", sourceUrl: "", sourceType: "official_society", notes: "" }],
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h2 className="font-heading text-2xl font-semibold text-foreground">
          {t("headingEdit")}
        </h2>
        <div className="flex items-center gap-2">
          <Button variant="outline" asChild>
            <a
              href={`${SITE_URL}${localizedPath(`/events/${event.slug}`, locale)}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <ExternalLink className="size-4" aria-hidden="true" />
              {t("viewPublished")}
            </a>
          </Button>
          <NotifyInterestedSurgeonsButton eventId={event.id} />
          <DeleteEventButton eventId={event.id} />
        </div>
      </div>
      <EventForm
        defaultValues={defaultValues}
        action={updateEventAction.bind(null, locale, event.id)}
      />
    </div>
  );
}
