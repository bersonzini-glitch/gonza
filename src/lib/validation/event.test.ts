import { describe, expect, it } from "vitest";

import { eventSchema, eventSearchSchema } from "@/lib/validation/event";

const validEvent = {
  title: "Congreso Latinoamericano de Columna",
  description: "A".repeat(40),
  eventType: "congress" as const,
  format: "in_person" as const,
  status: "approved" as const,
  isFeatured: false,
  startDate: "2026-06-10",
  endDate: "2026-06-12",
  startTime: "",
  endTime: "",
  dateNote: "",
  timezone: "America/Sao_Paulo",
  country: "Brazil",
  city: "São Paulo",
  venue: "Convention Center",
  organizer: "Sociedade Brasileira de Coluna",
  topics: ["Spinal Deformity"],
  officialUrl: "https://example.org/congress",
  registrationUrl: "",
  sourceUrl: "https://example.org/congress",
  lastVerifiedAt: "2026-01-01",
  sources: [
    {
      sourceName: "Official society page",
      sourceUrl: "https://example.org/congress",
      sourceType: "official_society" as const,
      notes: "",
    },
  ],
};

describe("eventSchema", () => {
  it("accepts a fully valid event", () => {
    expect(eventSchema.safeParse(validEvent).success).toBe(true);
  });

  it("rejects an end date before the start date", () => {
    const result = eventSchema.safeParse({ ...validEvent, endDate: "2026-06-01" });
    expect(result.success).toBe(false);
  });

  it("rejects a non-http(s) official URL", () => {
    const result = eventSchema.safeParse({ ...validEvent, officialUrl: "ftp://example.org" });
    expect(result.success).toBe(false);
  });

  it("requires at least one topic", () => {
    const result = eventSchema.safeParse({ ...validEvent, topics: [] });
    expect(result.success).toBe(false);
  });

  it("requires at least one data source", () => {
    const result = eventSchema.safeParse({ ...validEvent, sources: [] });
    expect(result.success).toBe(false);
  });
});

describe("eventSearchSchema", () => {
  it("defaults sort to 'soonest' and page to 1", () => {
    const result = eventSearchSchema.parse({});
    expect(result.sort).toBe("soonest");
    expect(result.page).toBe(1);
  });

  it("coerces a string page number", () => {
    const result = eventSearchSchema.parse({ page: "3" });
    expect(result.page).toBe(3);
  });
});
