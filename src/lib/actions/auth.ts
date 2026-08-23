"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { checkRateLimit } from "@/lib/rate-limit";
import { createClient } from "@/lib/supabase/server";
import {
  requestPasswordResetSchema,
  resetPasswordSchema,
  signInSchema,
  signUpSchema,
} from "@/lib/validation/auth";

export interface AuthActionState {
  error?: string;
  success?: string;
}

async function getClientIp(): Promise<string> {
  const h = await headers();
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
}

// Supabase Auth returns its own error messages in English (they come
// from the auth service, not our code). This maps the common ones to
// Spanish for a fully localized UI; anything unrecognized falls back to
// the original message rather than being silently swallowed.
const AUTH_ERROR_TRANSLATIONS: Record<string, string> = {
  "User already registered": "Ese email ya está registrado.",
  "Password should be at least 6 characters":
    "La contraseña debe tener al menos 6 caracteres.",
  "Email not confirmed": "Todavía no confirmaste tu email.",
  "Invalid login credentials": "Email o contraseña inválidos.",
  "Unable to validate email address: invalid format": "El formato del email no es válido.",
  "Signup requires a valid password": "El registro requiere una contraseña válida.",
  "For security purposes, you can only request this after some time.":
    "Por seguridad, solo podés solicitar esto de nuevo después de un tiempo.",
};

function translateAuthError(message: string): string {
  return AUTH_ERROR_TRANSLATIONS[message] ?? message;
}

export async function signUpAction(
  _prevState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const parsed = signUpSchema.safeParse({
    username: formData.get("username"),
    fullName: formData.get("fullName"),
    email: formData.get("email"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }

  const supabase = await createClient();
  const ip = await getClientIp();

  const allowed = await checkRateLimit(supabase, ip, "sign-up", 5, 60 * 15);
  if (!allowed) {
    return { error: "Demasiados intentos. Esperá unos minutos y volvé a intentar." };
  }

  const { data: available } = await supabase.rpc("is_username_available", {
    check_username: parsed.data.username,
  });
  if (available === false) {
    return { error: "Ese nombre de usuario ya está en uso." };
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
    return { error: translateAuthError(error.message) };
  }

  return {
    success:
      "Cuenta creada. Revisá tu email para confirmar tu dirección antes de iniciar sesión.",
  };
}

export async function signInAction(
  _prevState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const parsed = signInSchema.safeParse({
    identifier: formData.get("identifier"),
    password: formData.get("password"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
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
    return { error: "Demasiados intentos. Esperá unos minutos y volvé a intentar." };
  }

  let email = parsed.data.identifier;
  if (!email.includes("@")) {
    const { data: resolvedEmail } = await supabase.rpc("get_email_by_username", {
      lookup_username: parsed.data.identifier,
    });
    if (!resolvedEmail) {
      return { error: "Usuario/email o contraseña inválidos." };
    }
    email = resolvedEmail;
  }

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password: parsed.data.password,
  });

  if (error) {
    return { error: "Usuario/email o contraseña inválidos." };
  }

  const next = formData.get("next");
  redirect(typeof next === "string" && next.startsWith("/") ? next : "/dashboard");
}

export async function signOutAction() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}

export async function requestPasswordResetAction(
  _prevState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const parsed = requestPasswordResetSchema.safeParse({ email: formData.get("email") });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }

  const supabase = await createClient();
  const ip = await getClientIp();

  const allowed = await checkRateLimit(supabase, ip, "reset-request", 5, 60 * 15);
  if (!allowed) {
    return { error: "Demasiados intentos. Esperá unos minutos y volvé a intentar." };
  }

  const h = await headers();
  const origin = `${h.get("x-forwarded-proto") ?? "https"}://${h.get("host")}`;

  await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${origin}/reset-password/confirm`,
  });

  // Always report success to avoid leaking whether an email is registered.
  return { success: "Si ese email está registrado, te llegará un enlace de recuperación." };
}

export async function updatePasswordAction(
  _prevState: AuthActionState,
  formData: FormData,
): Promise<AuthActionState> {
  const parsed = resetPasswordSchema.safeParse({
    password: formData.get("password"),
    confirmPassword: formData.get("confirmPassword"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Tu enlace de recuperación expiró. Solicitá uno nuevo." };
  }

  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });

  if (error) {
    return { error: translateAuthError(error.message) };
  }

  redirect("/dashboard");
}
