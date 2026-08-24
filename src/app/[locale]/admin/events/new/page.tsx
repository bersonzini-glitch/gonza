import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { EventForm } from "@/components/admin/event-form";
import { createEventAction } from "@/lib/actions/admin";
import type { EventInput } from "@/lib/validation/event";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/admin/events/new">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "eventForm" });
  return { title: t("metaTitleNew") };
}

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

export default async function NewEventPage({
  params,
}: PageProps<"/[locale]/admin/events/new">) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "eventForm" });

  return (
    <div>
      <h2 className="mb-6 font-heading text-2xl font-semibold text-foreground">
        {t("headingNew")}
      </h2>
      <EventForm defaultValues={defaultValues} action={createEventAction.bind(null, locale)} />
    </div>
  );
}
