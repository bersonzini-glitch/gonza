import type { useTranslations } from "next-intl";
import { z } from "zod";

export const ADMIN_EMAIL_MODES = ["single", "bulk", "invite"] as const;
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
      inviteRecipients: z.string().trim().optional().or(z.literal("")),
      filterNotifyNewEvents: z.boolean().default(false),
      filterNotifySuggestedInvitations: z.boolean().default(false),
      subject: z.string().trim().optional().or(z.literal("")),
      message: z.string().trim().optional().or(z.literal("")),
    })
    .superRefine((data, ctx) => {
      if (data.mode === "invite") {
        if (parseEmailList(data.inviteRecipients ?? "").length === 0) {
          ctx.addIssue({
            code: "custom",
            path: ["inviteRecipients"],
            message: t("inviteRecipientsRequired"),
          });
        }
        return;
      }

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

      const subject = data.subject ?? "";
      if (subject.length < 3) {
        ctx.addIssue({ code: "custom", path: ["subject"], message: t("subjectRequired") });
      } else if (subject.length > 150) {
        ctx.addIssue({ code: "custom", path: ["subject"], message: t("subjectTooLong") });
      }

      const message = data.message ?? "";
      if (message.length < 10) {
        ctx.addIssue({ code: "custom", path: ["message"], message: t("messageTooShort") });
      } else if (message.length > 5000) {
        ctx.addIssue({ code: "custom", path: ["message"], message: t("messageTooLong") });
      }
    });
}

export type AdminEmailInput = z.infer<ReturnType<typeof makeAdminEmailSchema>>;
