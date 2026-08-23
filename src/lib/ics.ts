import { createEvent, type DateArray, type EventAttributes } from "ics";

interface IcsEventInput {
  title: string;
  description: string;
  startDate: string; // YYYY-MM-DD
  endDate: string; // YYYY-MM-DD
  startTime: string | null; // HH:MM, UTC-agnostic local event time
  endTime: string | null; // HH:MM
  location: string;
  url: string;
}

function toDateArray(dateStr: string, timeStr: string | null): DateArray {
  const [year, month, day] = dateStr.split("-").map(Number);
  if (!timeStr) return [year, month, day];
  const [hour, minute] = timeStr.split(":").map(Number);
  return [year, month, day, hour, minute];
}

/** Generates an .ics file string for an event, all-day or timed. */
export function generateEventIcs(event: IcsEventInput): string {
  const start = toDateArray(event.startDate, event.startTime);
  const end = toDateArray(event.endDate, event.endTime ?? event.startTime);

  // Without a full IANA timezone → UTC-offset table, the most correct
  // representation of "9am in the event's own timezone" is a floating
  // local time (RFC 5545 form #1: no trailing Z, no conversion) rather
  // than guessing an offset — that's what startOutputType/endOutputType
  // "local" produce. All-day events (no time given) use plain DATE
  // values instead, which are inherently timezone-agnostic.
  const attributes: EventAttributes = {
    title: event.title,
    description: event.description,
    location: event.location,
    url: event.url,
    start,
    end,
    startOutputType: "local",
    endOutputType: "local",
  };

  const { error, value } = createEvent(attributes);

  if (error || !value) {
    throw new Error(`Failed to generate .ics file: ${error?.message ?? "unknown error"}`);
  }

  return value;
}
