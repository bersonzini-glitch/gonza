import type { useTranslations } from "next-intl";
import { z } from "zod";

import { LANGUAGE_OPTIONS } from "@/lib/validation/surgeon";

export { LANGUAGE_OPTIONS };

export const EVENT_TYPES = ["congress", "conference", "course", "workshop", "webinar"] as const;
export const EVENT_FORMATS = ["in_person", "hybrid", "online"] as const;
export const EVENT_STATUSES = ["pending", "approved", "rejected"] as const;
export const EVENT_SOURCE_TYPES = [
  "official_society",
  "hospital",
  "university",
  "organizer",
  "rss",
  "public_api",
  "other",
] as const;

export const EVENT_TOPICS = [
  "Cirugía de columna",
  "Neurocirugía",
  "Ortopedia",
  "Cirugía mínimamente invasiva",
  "Deformidad espinal",
  "Trauma espinal",
  "Columna degenerativa",
  "Columna pediátrica",
  "Oncología de columna",
  "Cirugía endoscópica de columna",
] as const;

export const LATAM_COUNTRIES = [
  "Argentina",
  "Bolivia",
  "Brasil",
  "Chile",
  "Colombia",
  "Costa Rica",
  "Cuba",
  "República Dominicana",
  "Ecuador",
  "El Salvador",
  "Guatemala",
  "Honduras",
  "México",
  "Nicaragua",
  "Panamá",
  "Paraguay",
  "Perú",
  "Uruguay",
  "Venezuela",
] as const;

type Translator = ReturnType<typeof useTranslations<"eventValidation">>;

const SLUG_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;

export function makeEventSchema(t: Translator) {
  const urlField = z.url({ protocol: /^https?$/, message: t("invalidUrl") });
  const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, t("invalidDateFormat"));
  const isoTime = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, t("invalidTimeFormat"));

  const eventSourceSchema = z.object({
    sourceName: z.string().trim().min(2).max(200),
    sourceUrl: urlField,
    sourceType: z.enum(EVENT_SOURCE_TYPES),
    notes: z.string().trim().max(500).optional().or(z.literal("")),
  });

  return z
    .object({
      title: z.string().trim().min(5, t("titleTooShort")).max(200),
      // Empty/omitted means "don't change it" — the field is only shown
      // once an event (and therefore a public URL) already exists.
      slug: z
        .string()
        .trim()
        .toLowerCase()
        .max(100, t("slugTooLong"))
        .optional()
        .or(z.literal(""))
        .refine((v) => !v || (v.length >= 3 && SLUG_PATTERN.test(v)), {
          message: t("slugInvalid"),
        }),
      description: z.string().trim().min(30, t("descriptionTooShort")).max(5000),
      eventType: z.enum(EVENT_TYPES),
      format: z.enum(EVENT_FORMATS),
      language: z.enum(LANGUAGE_OPTIONS),
      status: z.enum(EVENT_STATUSES).default("approved"),
      isFeatured: z.boolean().default(false),
      startDate: isoDate,
      endDate: isoDate,
      startTime: isoTime.optional().or(z.literal("")),
      endTime: isoTime.optional().or(z.literal("")),
      dateNote: z.string().trim().max(200).optional().or(z.literal("")),
      timezone: z.string().trim().min(1).max(50).default("UTC"),
      country: z.string().trim().min(2).max(100),
      city: z.string().trim().max(100).optional().or(z.literal("")),
      venue: z.string().trim().max(200).optional().or(z.literal("")),
      organizer: z.string().trim().min(2).max(200),
      topics: z.array(z.string().trim().min(1).max(60)).min(1, t("topicsRequired")).max(10),
      officialUrl: urlField,
      registrationUrl: urlField.optional().or(z.literal("")),
      sourceUrl: urlField,
      lastVerifiedAt: isoDate,
      sources: z.array(eventSourceSchema).min(1, t("sourcesRequired")).max(5),
    })
    .refine((data) => data.endDate >= data.startDate, {
      message: t("endDateBeforeStart"),
      path: ["endDate"],
    });
}

export type EventInput = z.infer<ReturnType<typeof makeEventSchema>>;

export const eventSearchSchema = z.object({
  q: z.string().trim().max(200).optional(),
  country: z.string().trim().max(100).optional(),
  eventType: z.enum(EVENT_TYPES).optional(),
  format: z.enum(EVENT_FORMATS).optional(),
  language: z.enum(LANGUAGE_OPTIONS).optional(),
  topic: z.string().trim().max(100).optional(),
  from: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  to: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  sort: z.enum(["soonest", "recently_added", "alphabetical"]).default("soonest"),
  includePast: z.coerce.boolean().optional(),
  page: z.coerce.number().int().min(1).default(1),
});

export type EventSearchInput = z.infer<typeof eventSearchSchema>;
