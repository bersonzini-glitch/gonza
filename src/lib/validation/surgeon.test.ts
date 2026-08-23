import { describe, expect, it } from "vitest";

import { deriveConsultationAvailability, surgeonProfileSchema } from "@/lib/validation/surgeon";

const validProfile = {
  fullName: "Ana Martínez",
  professionalTitle: "Orthopedic Spine Surgeon, MD",
  primarySpecialty: "orthopedic_spine_surgeon" as const,
  subspecialties: ["Spinal Deformity"],
  bio: "A".repeat(60),
  hospitalAffiliation: "Hospital Central",
  medicalLicenseNumber: "12345",
  medicalLicenseCountry: "Argentina",
  yearsExperience: 12,
  consultationFormat: "both" as const,
  languages: ["Spanish", "English"] as const,
  websiteUrl: "https://example.com",
  contactEmail: "ana@example.com",
  contactPhone: "+54 11 5555 5555",
  locations: [{ country: "Argentina", city: "Buenos Aires", isPrimary: true }],
};

describe("surgeonProfileSchema", () => {
  it("accepts a fully valid profile", () => {
    const result = surgeonProfileSchema.safeParse(validProfile);
    expect(result.success).toBe(true);
  });

  it("rejects a bio that's too short", () => {
    const result = surgeonProfileSchema.safeParse({ ...validProfile, bio: "too short" });
    expect(result.success).toBe(false);
  });

  it("rejects an empty locations array", () => {
    const result = surgeonProfileSchema.safeParse({ ...validProfile, locations: [] });
    expect(result.success).toBe(false);
  });

  it("rejects an empty subspecialties array", () => {
    const result = surgeonProfileSchema.safeParse({ ...validProfile, subspecialties: [] });
    expect(result.success).toBe(false);
  });

  it("rejects a non-https website URL", () => {
    const result = surgeonProfileSchema.safeParse({
      ...validProfile,
      websiteUrl: "javascript:alert(1)",
    });
    expect(result.success).toBe(false);
  });

  it("allows an empty website URL", () => {
    const result = surgeonProfileSchema.safeParse({ ...validProfile, websiteUrl: "" });
    expect(result.success).toBe(true);
  });
});

describe("deriveConsultationAvailability", () => {
  it("derives both flags for 'both'", () => {
    expect(deriveConsultationAvailability("both")).toEqual({
      inPersonAvailable: true,
      telemedicineAvailable: true,
    });
  });

  it("derives only in-person for 'in_person'", () => {
    expect(deriveConsultationAvailability("in_person")).toEqual({
      inPersonAvailable: true,
      telemedicineAvailable: false,
    });
  });

  it("derives only telemedicine for 'telemedicine'", () => {
    expect(deriveConsultationAvailability("telemedicine")).toEqual({
      inPersonAvailable: false,
      telemedicineAvailable: true,
    });
  });
});
