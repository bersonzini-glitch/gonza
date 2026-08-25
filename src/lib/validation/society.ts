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

export function makeSocietySchema(t: Translator) {
  return z.object({
    name: z.string().trim().min(2, t("nameMin")).max(200),
    description: z.string().trim().min(10, t("descriptionMin")).max(2000),
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
