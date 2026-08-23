import { describe, expect, it } from "vitest";

import { generateEventIcs } from "@/lib/ics";

describe("generateEventIcs", () => {
  it("generates a valid all-day VCALENDAR when no times are given", () => {
    const ics = generateEventIcs({
      title: "Congreso de Columna",
      description: "Description",
      startDate: "2026-06-10",
      endDate: "2026-06-12",
      startTime: null,
      endTime: null,
      location: "São Paulo, Brazil",
      url: "https://example.org",
    });

    expect(ics).toContain("BEGIN:VCALENDAR");
    expect(ics).toContain("SUMMARY:Congreso de Columna");
    expect(ics).toContain("DTSTART;VALUE=DATE:20260610");
  });

  it("generates a timed event when start/end times are given", () => {
    const ics = generateEventIcs({
      title: "Webinar",
      description: "Description",
      startDate: "2026-06-10",
      endDate: "2026-06-10",
      startTime: "09:00",
      endTime: "10:30",
      location: "Online",
      url: "https://example.org",
    });

    expect(ics).toContain("DTSTART:20260610T090000");
    expect(ics).toContain("DTEND:20260610T103000");
  });
});
