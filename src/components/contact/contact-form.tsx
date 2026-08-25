"use client";

import { AlertCircle, CheckCircle2 } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useActionState } from "react";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { sendContactMessageAction, type ContactActionState } from "@/lib/actions/contact";

const initialState: ContactActionState = {};

export function ContactForm() {
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
        <Label htmlFor="name">{t("nameLabel")}</Label>
        <Input id="name" name="name" autoComplete="name" required />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="email">{t("emailLabel")}</Label>
        <Input id="email" name="email" type="email" autoComplete="email" required />
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
