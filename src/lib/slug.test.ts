import { describe, expect, it } from "vitest";

import { slugify } from "@/lib/slug";

describe("slugify", () => {
  it("lowercases and hyphenates", () => {
    expect(slugify("Hello World")).toBe("hello-world");
  });

  it("strips accents", () => {
    expect(slugify("José Núñez")).toBe("jose-nunez");
  });

  it("collapses non-alphanumeric runs into a single hyphen", () => {
    expect(slugify("Dr. José — Columna & Escoliosis!!")).toBe("dr-jose-columna-escoliosis");
  });

  it("trims leading/trailing hyphens", () => {
    expect(slugify("  --Spinal Surgery--  ")).toBe("spinal-surgery");
  });

  it("truncates to 80 characters", () => {
    const long = "a".repeat(200);
    expect(slugify(long).length).toBeLessThanOrEqual(80);
  });
});
