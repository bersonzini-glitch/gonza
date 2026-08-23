import type { Metadata } from "next";

import { EventForm } from "@/components/admin/event-form";
import { createEventAction } from "@/lib/actions/admin";
import type { EventInput } from "@/lib/validation/event";

export const metadata: Metadata = { title: "New event" };

const defaultValues: EventInput = {
  title: "",
  description: "",
  eventType: "congress",
  format: "in_person",
  status: "approved",
  isFeatured: false,
  startDate: "",
  endDate: "",
  startTime: "",
  endTime: "",
  dateNote: "",
  timezone: "UTC",
  country: "",
  city: "",
  venue: "",
  organizer: "",
  topics: [],
  officialUrl: "",
  registrationUrl: "",
  sourceUrl: "",
  lastVerifiedAt: new Date().toISOString().slice(0, 10),
  sources: [{ sourceName: "", sourceUrl: "", sourceType: "official_society", notes: "" }],
};

export default function NewEventPage() {
  return (
    <div>
      <h2 className="mb-6 font-heading text-2xl font-semibold text-foreground">New event</h2>
      <EventForm defaultValues={defaultValues} action={createEventAction} />
    </div>
  );
}
