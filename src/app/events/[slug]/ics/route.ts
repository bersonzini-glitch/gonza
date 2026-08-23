import { NextResponse } from "next/server";

import { getEventBySlug } from "@/lib/data/events";
import { generateEventIcs } from "@/lib/ics";
import { slugify } from "@/lib/slug";

export async function GET(_request: Request, context: RouteContext<"/events/[slug]/ics">) {
  const { slug } = await context.params;
  const event = await getEventBySlug(slug);

  if (!event) {
    return NextResponse.json({ error: "Event not found" }, { status: 404 });
  }

  const ics = generateEventIcs({
    title: event.title,
    description: `${event.description}\n\nOfficial site: ${event.official_url}`,
    startDate: event.start_date,
    endDate: event.end_date,
    startTime: event.start_time,
    endTime: event.end_time,
    location: [event.venue, event.city, event.country].filter(Boolean).join(", "),
    url: event.official_url,
  });

  return new NextResponse(ics, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="${slugify(event.title)}.ics"`,
    },
  });
}
