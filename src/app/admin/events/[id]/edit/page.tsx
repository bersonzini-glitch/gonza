import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { DeleteEventButton } from "@/components/admin/delete-event-button";
import { EventForm } from "@/components/admin/event-form";
import { updateEventAction } from "@/lib/actions/admin";
import { getEventForAdmin } from "@/lib/data/admin";
import type { EventInput } from "@/lib/validation/event";

export const metadata: Metadata = { title: "Editar evento" };
export const dynamic = "force-dynamic";

export default async function EditEventPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const event = await getEventForAdmin(id);
  if (!event) notFound();

  const defaultValues: EventInput = {
    title: event.title,
    description: event.description,
    eventType: event.event_type,
    format: event.format,
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
        <h2 className="font-heading text-2xl font-semibold text-foreground">Editar evento</h2>
        <DeleteEventButton eventId={event.id} />
      </div>
      <EventForm
        defaultValues={defaultValues}
        action={(values) => updateEventAction(event.id, values)}
      />
    </div>
  );
}
