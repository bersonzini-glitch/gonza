import type { useTranslations } from "next-intl";
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
  "Columna degenerativa",
  "Deformidad espinal",
  "Trauma espinal",
  "Cirugía mínimamente invasiva",
  "Tumores de columna / Oncología",
  "Columna pediátrica",
  "Cirugía de revisión de columna",
  "Infecciones de columna",
  "Columna deportiva",
  "Manejo del dolor",
  "Robótica y navegación",
  "Cirugía endoscópica de columna",
  "Columna cervical",
  "Columna lumbar",
  "Escoliosis",
] as const;

export const LANGUAGE_OPTIONS = [
  "Español",
  "Portugués",
  "Inglés",
  "Francés",
  "Italiano",
  "Alemán",
] as const;

type Translator = ReturnType<typeof useTranslations<"surgeonValidation">>;

export function makeSurgeonLocationSchema(t: Translator) {
  return z.object({
    country: z.string().trim().min(2, t("countryRequired")).max(100),
    city: z.string().trim().min(2, t("cityRequired")).max(100),
    isPrimary: z.boolean(),
  });
}

const SLUG_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;

function optionalUrlField(t: Translator) {
  return z.union([z.url({ protocol: /^https?$/, message: t("invalidUrl") }), z.literal("")]).optional();
}

export function makeSurgeonProfileSchema(t: Translator) {
  return z.object({
    fullName: z.string().trim().min(3, t("fullNameTooShort")).max(150),
    // Empty/omitted means "don't change it" — the field is only shown once a
    // profile (and therefore a public URL) already exists.
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
    primarySpecialty: z.enum(PRIMARY_SPECIALTIES),
    subspecialties: z
      .array(z.string().trim().min(2).max(80))
      .min(1, t("subspecialtiesRequired"))
      .max(15),
    bio: z.string().trim().min(50, t("bioTooShort")).max(4000, t("bioTooLong")),
    hospitalAffiliations: z
      .array(z.string().trim().min(1, t("hospitalNameEmpty")).max(200))
      .max(10, t("tooManyHospitals"))
      .optional(),
    medicalLicenseNumber: z.string().trim().max(100).optional().or(z.literal("")),
    medicalLicenseCountry: z.string().trim().max(100).optional().or(z.literal("")),
    specialistLicenseNumber: z.string().trim().max(100).optional().or(z.literal("")),
    yearsExperience: z.coerce.number().int().min(0).max(70).optional(),
    consultationFormat: z.enum(CONSULTATION_FORMATS),
    languages: z.array(z.enum(LANGUAGE_OPTIONS)).min(1, t("languagesRequired")),
    websiteUrl: optionalUrlField(t),
    instagramUrl: optionalUrlField(t),
    linkedinUrl: optionalUrlField(t),
    contactEmail: z.union([z.email({ message: t("invalidEmail") }), z.literal("")]).optional(),
    contactPhone: z.string().trim().max(40).optional().or(z.literal("")),
    locations: z.array(makeSurgeonLocationSchema(t)).min(1, t("locationsRequired")).max(10),
  });
}

export type SurgeonProfileFormValues = z.infer<ReturnType<typeof makeSurgeonProfileSchema>>;

/** Deriva las dos columnas booleanas de la DB a partir del campo consultationFormat. */
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
