"use client";

import { AlertCircle, CheckCircle2 } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useActionState } from "react";

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signUpAction, type AuthActionState } from "@/lib/actions/auth";

const initialState: AuthActionState = {};

export function SignUpForm() {
  const locale = useLocale();
  const t = useTranslations("auth");
  const [state, formAction, isPending] = useActionState(
    signUpAction.bind(null, locale),
    initialState,
  );

  if (state.success) {
    return (
      <Alert>
        <CheckCircle2 className="size-4" />
        <AlertTitle>{t("checkYourEmail")}</AlertTitle>
        <AlertDescription>{state.success}</AlertDescription>
      </Alert>
    );
  }

  return (
    <form action={formAction} className="space-y-4" noValidate>
      <div className="space-y-1.5">
        <Label htmlFor="username">{t("username")}</Label>
        <Input id="username" name="username" autoComplete="username" required minLength={3} />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="fullName">{t("fullName")}</Label>
        <Input id="fullName" name="fullName" autoComplete="name" required />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="email">{t("email")}</Label>
        <Input id="email" name="email" type="email" autoComplete="email" required />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="password">{t("password")}</Label>
        <Input
          id="password"
          name="password"
          type="password"
          autoComplete="new-password"
          required
          minLength={8}
        />
        <p className="text-xs text-muted-foreground">{t("passwordHint")}</p>
      </div>

      <div className="space-y-2 border-t border-border pt-4">
        <label className="flex items-start gap-2 text-sm">
          <Checkbox name="notifyNewEvents" defaultChecked className="mt-0.5" />
          {t("notifyNewEventsLabel")}
        </label>
        <label className="flex items-start gap-2 text-sm">
          <Checkbox name="notifySuggestedInvitations" defaultChecked className="mt-0.5" />
          {t("notifySuggestedInvitationsLabel")}
        </label>
      </div>

      {state.error && (
        <Alert variant="destructive">
          <AlertCircle className="size-4" />
          <AlertDescription>{state.error}</AlertDescription>
        </Alert>
      )}

      <Button type="submit" className="w-full" disabled={isPending}>
        {isPending ? t("creatingAccount") : t("signUpButton")}
      </Button>
    </form>
  );
}
