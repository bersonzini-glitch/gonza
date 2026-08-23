import { describe, expect, it } from "vitest";

import { formatDate, formatDateRange, formatTimeRange } from "@/lib/format";

describe("formatDate", () => {
  it("formats without shifting timezone", () => {
    expect(formatDate("2026-03-05")).toBe("5 de marzo de 2026");
  });
});

describe("formatDateRange", () => {
  it("collapses a single-day event to one date", () => {
    expect(formatDateRange("2026-03-05", "2026-03-05")).toBe("5 de marzo de 2026");
  });

  it("shows a range for multi-day events", () => {
    expect(formatDateRange("2026-03-05", "2026-03-08")).toBe("5 mar 2026 – 8 de marzo de 2026");
  });
});

describe("formatTimeRange", () => {
  it("returns null when there's no start time", () => {
    expect(formatTimeRange(null, null)).toBeNull();
  });

  it("formats a single time", () => {
    expect(formatTimeRange("09:00", null)).toBe("9:00 a.m.");
  });

  it("formats a time range", () => {
    expect(formatTimeRange("09:00", "17:30")).toBe("9:00 a.m. – 5:30 p.m.");
  });
});
