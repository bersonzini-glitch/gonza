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
//
// Stored as stable snake_case keys (not display text) so the same profile
// shows a translated label in each locale instead of whatever language it
// happened to be picked in — see subspecialtyLabels() in lib/format.ts.
// Anything a surgeon types into the free-text "add another" field isn't one
// of these keys and is stored/shown verbatim, unlocalized, in whatever
// language they wrote it.
export const SUGGESTED_SUBSPECIALTIES = [
  "degenerative_spine",
  "spinal_deformity",
  "spinal_trauma",
  "minimally_invasive_surgery",
  "spine_tumors_oncology",
  "pediatric_spine",
  "spine_revision_surgery",
  "spine_infections",
  "sports_spine",
  "pain_management",
  "robotics_navigation",
  "endoscopic_spine_surgery",
  "cervical_spine",
  "lumbar_spine",
  "scoliosis",
] as const;

export type SubspecialtyKey = (typeof SUGGESTED_SUBSPECIALTIES)[number];

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
