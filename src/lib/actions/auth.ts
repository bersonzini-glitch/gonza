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
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const supabase = await createClient();
  const ip = await getClientIp();

  const allowed = await checkRateLimit(supabase, ip, "sign-up", 5, 60 * 15);
  if (!allowed) {
    return { error: "Too many attempts. Please wait a few minutes and try again." };
  }

  const { data: available } = await supabase.rpc("is_username_available", {
    check_username: parsed.data.username,
  });
  if (available === false) {
    return { error: "That username is already taken." };
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
    return { error: error.message };
  }

  return {
    success: "Account created. Check your email to confirm your address before signing in.",
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
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
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
    return { error: "Too many attempts. Please wait a few minutes and try again." };
  }

  let email = parsed.data.identifier;
  if (!email.includes("@")) {
    const { data: resolvedEmail } = await supabase.rpc("get_email_by_username", {
      lookup_username: parsed.data.identifier,
    });
    if (!resolvedEmail) {
      return { error: "Invalid username/email or password." };
    }
    email = resolvedEmail;
  }

  const { error } = await supabase.auth.signInWithPassword({
    email,
    password: parsed.data.password,
  });

  if (error) {
    return { error: "Invalid username/email or password." };
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
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const supabase = await createClient();
  const ip = await getClientIp();

  const allowed = await checkRateLimit(supabase, ip, "reset-request", 5, 60 * 15);
  if (!allowed) {
    return { error: "Too many attempts. Please wait a few minutes and try again." };
  }

  const h = await headers();
  const origin = `${h.get("x-forwarded-proto") ?? "https"}://${h.get("host")}`;

  await supabase.auth.resetPasswordForEmail(parsed.data.email, {
    redirectTo: `${origin}/reset-password/confirm`,
  });

  // Always report success to avoid leaking whether an email is registered.
  return { success: "If that email is registered, a reset link is on its way." };
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
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "Your password reset link has expired. Please request a new one." };
  }

  const { error } = await supabase.auth.updateUser({ password: parsed.data.password });

  if (error) {
    return { error: error.message };
  }

  redirect("/dashboard");
}
