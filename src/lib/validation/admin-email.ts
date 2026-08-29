import type { useTranslations } from "next-intl";
import { z } from "zod";

export const ADMIN_EMAIL_MODES = ["single", "bulk"] as const;
export const ADMIN_EMAIL_AUDIENCES = ["approved_surgeons", "custom"] as const;

type Translator = ReturnType<typeof useTranslations<"adminEmailValidation">>;

const emailSchema = z.string().trim().email();

export function parseEmailList(raw: string): string[] {
  return Array.from(
    new Set(
      raw
        .split(/[\n,;]+/)
        .map((s) => s.trim())
        .filter((s) => emailSchema.safeParse(s).success),
    ),
  );
}

export function makeAdminEmailSchema(t: Translator) {
  return z
    .object({
      mode: z.enum(ADMIN_EMAIL_MODES),
      recipientEmail: z.string().trim().optional().or(z.literal("")),
      audience: z.enum(ADMIN_EMAIL_AUDIENCES),
      customRecipients: z.string().trim().optional().or(z.literal("")),
      filterNotifyNewEvents: z.boolean().default(false),
      filterNotifySuggestedInvitations: z.boolean().default(false),
      subject: z.string().trim().min(3, t("subjectRequired")).max(150, t("subjectTooLong")),
      message: z.string().trim().min(10, t("messageTooShort")).max(5000, t("messageTooLong")),
    })
    .superRefine((data, ctx) => {
      if (data.mode === "single") {
        if (!emailSchema.safeParse(data.recipientEmail).success) {
          ctx.addIssue({
            code: "custom",
            path: ["recipientEmail"],
            message: t("recipientEmailInvalid"),
          });
        }
      } else if (data.audience === "custom" && parseEmailList(data.customRecipients ?? "").length === 0) {
        ctx.addIssue({
          code: "custom",
          path: ["customRecipients"],
          message: t("customRecipientsRequired"),
        });
      }
    });
}

export type AdminEmailInput = z.infer<ReturnType<typeof makeAdminEmailSchema>>;
