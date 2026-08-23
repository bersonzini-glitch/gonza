import { z } from "zod";

export const PRIMARY_SPECIALTIES = ["orthopedic_spine_surgeon", "neurosurgeon_spine"] as const;

export const CONSULTATION_FORMATS = ["in_person", "telemedicine", "both"] as const;

// Subspecialties are free-text rows in the DB (see
// supabase/migrations/20260822000500_surgeon_specialties_locations.sql) so
// admins can extend the vocabulary without a migration. This is the
// canonical suggested list surfaced in the registration form and the
// directory filter — surgeons aren't limited to it, but it keeps the
// common cases consistent.
export const SUGGESTED_SUBSPECIALTIES = [
  "Degenerative Spine",
  "Spinal Deformity",
  "Spinal Trauma",
  "Minimally Invasive Surgery",
  "Spine Tumor / Oncology",
  "Pediatric Spine",
  "Revision Spine Surgery",
  "Spine Infection",
  "Sports Spine",
  "Pain Management",
  "Robotics & Navigation",
  "Endoscopic Spine Surgery",
  "Cervical Spine",
  "Lumbar Spine",
  "Scoliosis",
] as const;

export const LANGUAGE_OPTIONS = [
  "Spanish",
  "Portuguese",
  "English",
  "French",
  "Italian",
  "German",
] as const;

export const surgeonLocationSchema = z.object({
  country: z.string().trim().min(2, "Country is required").max(100),
  city: z.string().trim().min(2, "City is required").max(100),
  isPrimary: z.boolean(),
});

export const surgeonProfileSchema = z.object({
  fullName: z.string().trim().min(3, "Full name is too short").max(150),
  professionalTitle: z.string().trim().max(150).optional().or(z.literal("")),
  primarySpecialty: z.enum(PRIMARY_SPECIALTIES),
  subspecialties: z
    .array(z.string().trim().min(2).max(80))
    .min(1, "Select or add at least one subspecialty")
    .max(15),
  bio: z
    .string()
    .trim()
    .min(50, "Biography should be at least 50 characters")
    .max(4000, "Biography is too long"),
  hospitalAffiliation: z.string().trim().max(200).optional().or(z.literal("")),
  medicalLicenseNumber: z.string().trim().max(100).optional().or(z.literal("")),
  medicalLicenseCountry: z.string().trim().max(100).optional().or(z.literal("")),
  yearsExperience: z.coerce.number().int().min(0).max(70).optional(),
  consultationFormat: z.enum(CONSULTATION_FORMATS),
  languages: z.array(z.enum(LANGUAGE_OPTIONS)).min(1, "Select at least one language"),
  websiteUrl: z
    .union([z.url({ protocol: /^https?$/, message: "Must be a valid http(s) URL" }), z.literal("")])
    .optional(),
  contactEmail: z.union([z.email(), z.literal("")]).optional(),
  contactPhone: z.string().trim().max(40).optional().or(z.literal("")),
  locations: z.array(surgeonLocationSchema).min(1, "Add at least one practice location").max(10),
});

export type SurgeonProfileFormValues = z.infer<typeof surgeonProfileSchema>;

/** Derives the two DB boolean columns from the single consultationFormat field. */
export function deriveConsultationAvailability(format: (typeof CONSULTATION_FORMATS)[number]) {
  return {
    inPersonAvailable: format === "in_person" || format === "both",
    telemedicineAvailable: format === "telemedicine" || format === "both",
  };
}

export const surgeonSearchSchema = z.object({
  q: z.string().trim().max(200).optional(),
  country: z.string().trim().max(100).optional(),
  city: z.string().trim().max(100).optional(),
  specialty: z.enum(PRIMARY_SPECIALTIES).optional(),
  subspecialty: z.string().trim().max(80).optional(),
  language: z.enum(LANGUAGE_OPTIONS).optional(),
  inPerson: z.coerce.boolean().optional(),
  telemedicine: z.coerce.boolean().optional(),
  page: z.coerce.number().int().min(1).default(1),
});

export type SurgeonSearchInput = z.infer<typeof surgeonSearchSchema>;
