import type { useTranslations } from "next-intl";
import { z } from "zod";

export const SOCIETY_SPECIALTIES = [
  "Neurocirugía",
  "Traumatología",
  "Dolor / Anestesiología",
  "Reumatología",
  "Multidisciplinar / Internacional",
] as const;

type Translator = ReturnType<typeof useTranslations<"societyValidation">>;

const SLUG_PATTERN = /^[a-z0-9]+(-[a-z0-9]+)*$/;

export function makeSocietySchema(t: Translator) {
  return z.object({
    name: z.string().trim().min(2, t("nameMin")).max(200),
    // Empty/omitted means "don't change it" — the field is only shown once
    // a society (and therefore a public URL) already exists.
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
    description: z.string().trim().min(10, t("descriptionMin")).max(4000),
    country: z.string().trim().min(2, t("countryRequired")).max(100),
    specialties: z
      .array(z.string().trim().min(1).max(60))
      .min(1, t("specialtiesRequired"))
      .max(5),
    websiteUrl: z.url({ protocol: /^https?$/, message: t("invalidUrl") }),
  });
}

export type SocietyInput = z.infer<ReturnType<typeof makeSocietySchema>>;

export const societySearchSchema = z.object({
  q: z.string().trim().max(200).optional(),
  country: z.string().trim().max(100).optional(),
  specialty: z.string().trim().max(100).optional(),
  page: z.coerce.number().int().min(1).default(1),
});

export type SocietySearchInput = z.infer<typeof societySearchSchema>;
