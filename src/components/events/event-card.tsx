import { CalendarDays, MapPin } from "lucide-react";
import { getLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";

import { Badge } from "@/components/ui/badge";
import { eventFormatLabels, eventTypeLabels, formatDateRange } from "@/lib/format";
import type { EventRow } from "@/lib/data/events";

export async function EventCard({ event }: { event: EventRow }) {
  const [locale, tCommon, tEventTypes, tEventFormats] = await Promise.all([
    getLocale(),
    getTranslations("common"),
    getTranslations("eventTypes"),
    getTranslations("eventFormats"),
  ]);
  const EVENT_TYPE_LABELS = eventTypeLabels(tEventTypes);
  const EVENT_FORMAT_LABELS = eventFormatLabels(tEventFormats);

  return (
    <Link
      href={`/events/${event.slug}`}
      className="group flex h-full flex-col gap-3 rounded-xl border border-border bg-card p-5 transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md focus-visible:-translate-y-0.5 focus-visible:border-primary/40 focus-visible:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <div className="flex flex-wrap items-center gap-1.5">
        <Badge variant="secondary">{EVENT_TYPE_LABELS[event.event_type]}</Badge>
        <Badge variant="outline">{EVENT_FORMAT_LABELS[event.format]}</Badge>
        {event.is_featured && (
          <Badge className="bg-accent text-accent-foreground">{tCommon("featured")}</Badge>
        )}
      </div>

      <h3 className="font-heading text-lg font-semibold leading-snug text-foreground group-hover:text-primary">
        {event.title}
      </h3>

      <div className="mt-auto space-y-1.5 text-sm text-muted-foreground">
        <p className="flex items-center gap-1.5">
          <CalendarDays className="size-3.5 shrink-0" aria-hidden="true" />
          {formatDateRange(event.start_date, event.end_date, locale)}
          {event.date_note ? ` · ${event.date_note}` : ""}
        </p>
        <p className="flex items-center gap-1.5">
          <MapPin className="size-3.5 shrink-0" aria-hidden="true" />
          {[event.city, event.country].filter(Boolean).join(", ")}
        </p>
        <p className="truncate text-xs">{event.organizer}</p>
      </div>
    </Link>
  );
}
