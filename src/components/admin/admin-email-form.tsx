"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle } from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { useForm, type Resolver } from "react-hook-form";
import { toast } from "sonner";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import type { AdminEmailActionResult } from "@/lib/actions/admin";
import {
  ADMIN_EMAIL_AUDIENCES,
  ADMIN_EMAIL_MODES,
  makeAdminEmailSchema,
  type AdminEmailInput,
} from "@/lib/validation/admin-email";

const defaultValues: AdminEmailInput = {
  mode: "single",
  recipientEmail: "",
  audience: "approved_surgeons",
  customRecipients: "",
  inviteRecipients: "",
  filterNotifyNewEvents: false,
  filterNotifySuggestedInvitations: false,
  subject: "",
  message: "",
};

export function AdminEmailForm({
  action,
}: {
  action: (values: AdminEmailInput) => Promise<AdminEmailActionResult>;
}) {
  const [serverError, setServerError] = useState<string | null>(null);
  const t = useTranslations("adminEmailForm");
  const tValidation = useTranslations("adminEmailValidation");

  const MODE_LABELS: Record<(typeof ADMIN_EMAIL_MODES)[number], string> = {
    single: t("modeSingle"),
    bulk: t("modeBulk"),
    invite: t("modeInvite"),
  };
  const AUDIENCE_LABELS: Record<(typeof ADMIN_EMAIL_AUDIENCES)[number], string> = {
    approved_surgeons: t("audienceApprovedSurgeons"),
    custom: t("audienceCustom"),
  };

  const form = useForm<AdminEmailInput>({
    resolver: zodResolver(makeAdminEmailSchema(tValidation)) as Resolver<AdminEmailInput>,
    defaultValues,
  });
  const mode = form.watch("mode");
  const audience = form.watch("audience");

  async function onSubmit(values: AdminEmailInput) {
    setServerError(null);
    const result = await action(values);
    if (result.error) {
      setServerError(result.error);
      return;
    }
    toast.success(t("sentToast", { count: result.recipientCount ?? 0 }));
    form.reset(defaultValues);
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="max-w-xl space-y-6" noValidate>
      <div className="space-y-1.5">
        <Label htmlFor="mode">{t("modeLabel")}</Label>
        <Select
          items={MODE_LABELS}
          value={mode}
          onValueChange={(v) => form.setValue("mode", v as AdminEmailInput["mode"])}
        >
          <SelectTrigger id="mode" className="w-full">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {ADMIN_EMAIL_MODES.map((m) => (
              <SelectItem key={m} value={m}>
                {MODE_LABELS[m]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {mode === "single" ? (
        <div className="space-y-1.5">
          <Label htmlFor="recipientEmail">{t("recipientEmailLabel")}</Label>
          <Input
            id="recipientEmail"
            type="email"
            placeholder="nombre@ejemplo.com"
            {...form.register("recipientEmail")}
          />
          {form.formState.errors.recipientEmail && (
            <p className="text-xs text-destructive">
              {form.formState.errors.recipientEmail.message}
            </p>
          )}
        </div>
      ) : mode === "invite" ? (
        <div className="space-y-1.5">
          <Label htmlFor="inviteRecipients">{t("inviteRecipientsLabel")}</Label>
          <Textarea
            id="inviteRecipients"
            rows={4}
            placeholder={t("customRecipientsPlaceholder")}
            {...form.register("inviteRecipients")}
          />
          <p className="text-xs text-muted-foreground">{t("customRecipientsHint")}</p>
          {form.formState.errors.inviteRecipients && (
            <p className="text-xs text-destructive">
              {form.formState.errors.inviteRecipients.message}
            </p>
          )}
          <p className="text-xs text-muted-foreground">{t("inviteContentHint")}</p>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="audience">{t("audienceLabel")}</Label>
            <Select
              items={AUDIENCE_LABELS}
              value={audience}
              onValueChange={(v) => form.setValue("audience", v as AdminEmailInput["audience"])}
            >
              <SelectTrigger id="audience" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ADMIN_EMAIL_AUDIENCES.map((a) => (
                  <SelectItem key={a} value={a}>
                    {AUDIENCE_LABELS[a]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          {audience === "approved_surgeons" && (
            <div className="space-y-2 rounded-lg border border-border p-3">
              <p className="text-xs font-medium text-muted-foreground">
                {t("preferenceFiltersLabel")}
              </p>
              <label className="flex items-center gap-2 text-sm">
                <Checkbox
                  checked={form.watch("filterNotifyNewEvents")}
                  onCheckedChange={(checked) =>
                    form.setValue("filterNotifyNewEvents", checked === true)
                  }
                />
                {t("filterNotifyNewEventsLabel")}
              </label>
              <label className="flex items-center gap-2 text-sm">
                <Checkbox
                  checked={form.watch("filterNotifySuggestedInvitations")}
                  onCheckedChange={(checked) =>
                    form.setValue("filterNotifySuggestedInvitations", checked === true)
                  }
                />
                {t("filterNotifySuggestedInvitationsLabel")}
              </label>
            </div>
          )}
          {audience === "custom" && (
            <div className="space-y-1.5">
              <Label htmlFor="customRecipients">{t("customRecipientsLabel")}</Label>
              <Textarea
                id="customRecipients"
                rows={4}
                placeholder={t("customRecipientsPlaceholder")}
                {...form.register("customRecipients")}
              />
              <p className="text-xs text-muted-foreground">{t("customRecipientsHint")}</p>
              {form.formState.errors.customRecipients && (
                <p className="text-xs text-destructive">
                  {form.formState.errors.customRecipients.message}
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {mode !== "invite" && (
        <>
          <div className="space-y-1.5">
            <Label htmlFor="subject">{t("subjectLabel")}</Label>
            <Input id="subject" {...form.register("subject")} />
            {form.formState.errors.subject && (
              <p className="text-xs text-destructive">{form.formState.errors.subject.message}</p>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="message">{t("messageLabel")}</Label>
            <Textarea id="message" rows={10} {...form.register("message")} />
            <p className="text-xs text-muted-foreground">{t("messageHint")}</p>
            {form.formState.errors.message && (
              <p className="text-xs text-destructive">{form.formState.errors.message.message}</p>
            )}
          </div>
        </>
      )}

      {serverError && (
        <Alert variant="destructive">
          <AlertCircle className="size-4" />
          <AlertDescription>{serverError}</AlertDescription>
        </Alert>
      )}

      <Button type="submit" size="lg" disabled={form.formState.isSubmitting}>
        {form.formState.isSubmitting ? t("sending") : t("send")}
      </Button>
    </form>
  );
}
