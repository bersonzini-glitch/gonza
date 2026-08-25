import type { useTranslations } from "next-intl";
import { z } from "zod";

type Translator = ReturnType<typeof useTranslations<"contactValidation">>;

export function makeContactSchema(t: Translator) {
  return z.object({
    name: z.string().trim().min(2, t("nameMin")).max(150),
    email: z.email(t("invalidEmail")),
    message: z.string().trim().min(10, t("messageMin")).max(5000),
  });
}

export type ContactInput = z.infer<ReturnType<typeof makeContactSchema>>;
