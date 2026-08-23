import { CalendarDays, MapPin } from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { EVENT_FORMAT_LABELS, EVENT_TYPE_LABELS, formatDateRange } from "@/lib/format";
import type { EventRow } from "@/lib/data/events";

export function EventCard({ event }: { event: EventRow }) {
  return (
    <Link
      href={`/events/${event.slug}`}
      className="group flex h-full flex-col gap-3 rounded-xl border border-border bg-card p-5 transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md focus-visible:-translate-y-0.5 focus-visible:border-primary/40 focus-visible:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <div className="flex flex-wrap items-center gap-1.5">
        <Badge variant="secondary">{EVENT_TYPE_LABELS[event.event_type]}</Badge>
        <Badge variant="outline">{EVENT_FORMAT_LABELS[event.format]}</Badge>
        {event.is_featured && (
          <Badge className="bg-accent text-accent-foreground">Destacado</Badge>
        )}
      </div>

      <h3 className="font-heading text-lg font-semibold leading-snug text-foreground group-hover:text-primary">
        {event.title}
      </h3>

      <div className="mt-auto space-y-1.5 text-sm text-muted-foreground">
        <p className="flex items-center gap-1.5">
          <CalendarDays className="size-3.5 shrink-0" aria-hidden="true" />
          {formatDateRange(event.start_date, event.end_date)}
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
