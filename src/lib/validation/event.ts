import { z } from "zod";

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
  "Spinal Surgery",
  "Neurosurgery",
  "Orthopedics",
  "Minimally Invasive Surgery",
  "Spinal Deformity",
  "Spinal Trauma",
  "Degenerative Spine",
  "Pediatric Spine",
  "Spine Oncology",
  "Endoscopic Spine Surgery",
] as const;

export const LATAM_COUNTRIES = [
  "Argentina",
  "Bolivia",
  "Brazil",
  "Chile",
  "Colombia",
  "Costa Rica",
  "Cuba",
  "Dominican Republic",
  "Ecuador",
  "El Salvador",
  "Guatemala",
  "Honduras",
  "Mexico",
  "Nicaragua",
  "Panama",
  "Paraguay",
  "Peru",
  "Uruguay",
  "Venezuela",
] as const;

const urlField = z.url({ protocol: /^https?$/, message: "Must be a valid http(s) URL" });
const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Use YYYY-MM-DD");
const isoTime = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/, "Use HH:MM (24h)");

export const eventSourceSchema = z.object({
  sourceName: z.string().trim().min(2).max(200),
  sourceUrl: urlField,
  sourceType: z.enum(EVENT_SOURCE_TYPES),
  notes: z.string().trim().max(500).optional().or(z.literal("")),
});

export const eventSchema = z
  .object({
    title: z.string().trim().min(5, "Title is too short").max(200),
    description: z
      .string()
      .trim()
      .min(30, "Description should be at least 30 characters")
      .max(5000),
    eventType: z.enum(EVENT_TYPES),
    format: z.enum(EVENT_FORMATS),
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
    topics: z.array(z.string().trim().min(1).max(60)).min(1, "Add at least one topic").max(10),
    officialUrl: urlField,
    registrationUrl: urlField.optional().or(z.literal("")),
    sourceUrl: urlField,
    lastVerifiedAt: isoDate,
    sources: z.array(eventSourceSchema).min(1, "Add at least one data source").max(5),
  })
  .refine((data) => data.endDate >= data.startDate, {
    message: "End date must be on or after the start date",
    path: ["endDate"],
  });

export type EventInput = z.infer<typeof eventSchema>;

export const eventSearchSchema = z.object({
  q: z.string().trim().max(200).optional(),
  country: z.string().trim().max(100).optional(),
  eventType: z.enum(EVENT_TYPES).optional(),
  format: z.enum(EVENT_FORMATS).optional(),
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
  page: z.coerce.number().int().min(1).default(1),
});

export type EventSearchInput = z.infer<typeof eventSearchSchema>;
