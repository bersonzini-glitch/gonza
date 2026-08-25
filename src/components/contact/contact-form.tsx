"use client";

import { AlertCircle, CheckCircle2, Lock } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useActionState } from "react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { sendContactMessageAction, type ContactActionState } from "@/lib/actions/contact";

const initialState: ContactActionState = {};

const LOCKED_FIELD_CLASSNAME = "read-only:bg-input/50 read-only:cursor-default";

export function ContactForm({
  defaultName,
  defaultEmail,
}: {
  defaultName?: string;
  defaultEmail?: string;
}) {
  const locale = useLocale();
  const t = useTranslations("contact");
  const [state, formAction, isPending] = useActionState(
    sendContactMessageAction.bind(null, locale),
    initialState,
  );

  if (state.success) {
    return (
      <Alert>
        <CheckCircle2 className="size-4" />
        <AlertDescription>{state.success}</AlertDescription>
      </Alert>
    );
  }

  return (
    <form action={formAction} className="space-y-4" noValidate>
      <div className="space-y-1.5">
        <Label htmlFor="name" className="flex items-center gap-1.5">
          {t("nameLabel")}
          {defaultName && <Lock className="size-3 text-muted-foreground" aria-hidden="true" />}
        </Label>
        <Input
          id="name"
          name="name"
          autoComplete="name"
          required
          defaultValue={defaultName}
          readOnly={Boolean(defaultName)}
          className={defaultName ? LOCKED_FIELD_CLASSNAME : undefined}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="email" className="flex items-center gap-1.5">
          {t("emailLabel")}
          {defaultEmail && <Lock className="size-3 text-muted-foreground" aria-hidden="true" />}
        </Label>
        <Input
          id="email"
          name="email"
          type="email"
          autoComplete="email"
          required
          defaultValue={defaultEmail}
          readOnly={Boolean(defaultEmail)}
          className={defaultEmail ? LOCKED_FIELD_CLASSNAME : undefined}
        />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="message">{t("messageLabel")}</Label>
        <Textarea id="message" name="message" rows={6} required />
      </div>

      {state.error && (
        <Alert variant="destructive">
          <AlertCircle className="size-4" />
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      )}

      <Button type="submit" disabled={isPending}>
        {isPending ? t("sending") : t("send")}
      </Button>
    </form>
  );
}
