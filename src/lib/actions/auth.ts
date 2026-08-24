"use server";

import { headers } from "next/headers";
import { getTranslations } from "next-intl/server";
import { redirect } from "next/navigation";

import { checkRateLimit } from "@/lib/rate-limit";
import { createClient } from "@/lib/supabase/server";
import {
  makeRequestPasswordResetSchema,
  makeResetPasswordSchema,
  makeSignInSchema,
  makeSignUpSchema,
} from "@/lib/validation/auth";

export interface AuthActionState {
  error?: string;
  success?: string;
}

async function getClientIp(): Promise<string> {
  const h = await headers();
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
}

// Supabase Auth returns its own error messages in English (they come from
// the auth service, not our code). This maps the common ones to the active
// locale for a fully localized UI; anything unrecognized falls back to the
// original message rather than being silently swallowed.
function translateAuthError(
  message: string,
  t: Awaited<ReturnType<typeof getTranslations<"authErrors">>>,
): string {
  const map: Record<string, string> = {
    "User already registered": t("alreadyRegistered"),
    "Password should be at least 6 characters": t("supabasePasswordMin"),
    "Email not confirmed": t("emailNotConfirmed"),
    "Invalid login credentials": t("invalidLoginCredentials"),
    "Unable to validate email address: invalid format": t("invalidEmailFormat"),
    "Signup requires a valid password": t("signUpRequiresPassword"),
    "For security purposes, you can only request this after some time.":
      t("rateLimitedBySupabase"),
  };
  return map[message] ?? message;
}

export async function signUpAction(
  locale: string,
  _prevState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const [tValidation, tErrors] = await Promise.all([
    getTranslations({ locale, namespace: "authValidation" }),
    getTranslations({ locale, namespace: "authErrors" }),
  ]);

  const parsed = makeSignUpSchema(tValidation).safeParse({
    username: formData.get("username"),
    fullName: formData.get("fullName"),
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? tErrors("invalidData") };
  }

  const supabase = await createClient();
  const ip = await getClientIp();

  const allowed = await checkRateLimit(supabase, ip, "sign-up", 5, 60 * 15);
  if (!allowed) {
    return { error: tErrors("tooManyAttempts") };
  }

  const { data: available } = await supabase.rpc("is_username_available", {
    check_username: parsed.data.username,
  });
  if (available === false) {
    return { error: tErrors("usernameTaken") };
  }

  const h = await headers();
  const origin = `${h.get("x-forwarded-proto") ?? "https"}://${h.get("host")}`;

  const { error } = await supabase.auth.signUp({
    email: parsed.data.email,
    password: parsed.data.password,
    options: {
      data: { username: parsed.data.username, full_name: parsed.data.fullName },
      emailRedirectTo: `${origin}/auth/callback`,
    },
  });

  if (error) {
    return { error: translateAuthError(error.message, tErrors) };
  }

  return { success: tErrors("signUpSuccess") };
}

export async function signInAction(
  locale: string,
  _prevState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const [tValidation, tErrors] = await Promise.all([
    getTranslations({ locale, namespace: "authValidation" }),
    getTranslations({ locale, namespace: "authErrors" }),
  ]);

  const parsed = makeSignInSchema(tValidation).safeParse({
    identifier: formData.get("identifier"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? tErrors("invalidData") };
  }

  const supabase = await createClient();
  const ip = await getClientIp();

  const allowed = await checkRateLimit(
    supabase,
    `${ip}:${parsed.data.identifier}`,
    "sign-in",
    8,
    60 * 10,
  );
  if (!allowed) {
    return { error: tErrors("tooManyAttempts") };
  }

  let email = parsed.data.identifier;
  if (!email.includes("@")) {
    const { data: resolvedEmail } = await supabase.rpc("get_email_by_username", {
      lookup_username: parsed.data.identifier,
    });
    if (!resolvedEmail) {
      return { error: tErrors("invalidCredentials") };
    }
    email = resolvedEmail;
  }

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password: parsed.data.password,
  });

  if (error) {
    return { error: tErrors("invalidCredentials") };
  }

  const next = formData.get("next");
  const localePrefix = locale === "es" ? "" : `/${locale}`;
  redirect(
    typeof next === "string" && next.startsWith("/")
      ? next
      : `${localePrefix}/dashboard`,
  );
}

export async function signOutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}

export async function requestPasswordResetAction(
  locale: string,
  _prevState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const [tValidation, tErrors] = await Promise.all([
    getTranslations({ locale, namespace: "authValidation" }),
    getTranslations({ locale, namespace: "authErrors" }),
  ]);

  const parsed = makeRequestPasswordResetSchema(tValidation).safeParse({
    email: formData.get("email"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? tErrors("invalidData") };
  }

  const supabase = await createClient();
  const ip = await getClientIp();

  const allowed = await checkRateLimit(supabase, ip, "reset-request", 5, 60 * 15);
  if (!allowed) {
    return { error: tErrors("tooManyAttempts") };
  }

  const h = await headers();
  const origin = `${h.get("x-forwarded-proto") ?? "https"}://${h.get("host")}`;
  const localePrefix = locale === "es" ? "" : `/${locale}`;

  await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${origin}${localePrefix}/reset-password/confirm`,
  });

  // Always report success to avoid leaking whether an email is registered.
  return { success: tErrors("resetSent") };
}

export async function updatePasswordAction(
  locale: string,
  _prevState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const [tValidation, tErrors] = await Promise.all([
    getTranslations({ locale, namespace: "authValidation" }),
    getTranslations({ locale, namespace: "authErrors" }),
  ]);

  const parsed = makeResetPasswordSchema(tValidation).safeParse({
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? tErrors("invalidData") };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: tErrors("resetLinkExpired") };
  }

  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });

  if (error) {
    return { error: translateAuthError(error.message, tErrors) };
  }

  const localePrefix = locale === "es" ? "" : `/${locale}`;
  redirect(`${localePrefix}/dashboard`);
}
