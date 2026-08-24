import type { useTranslations } from "next-intl";
import { z } from "zod";

type Translator = ReturnType<typeof useTranslations<"authValidation">>;

function usernameField(t: Translator) {
  return z
    .string()
    .trim()
    .min(3, t("usernameMin"))
    .max(32, t("usernameMax"))
    .regex(/^[a-zA-Z0-9_.-]+$/, t("usernamePattern"));
}

function passwordField(t: Translator) {
  return z
    .string()
    .min(8, t("passwordMin"))
    .max(128)
    .regex(/[a-z]/, t("passwordLower"))
    .regex(/[A-Z]/, t("passwordUpper"))
    .regex(/[0-9]/, t("passwordNumber"));
}

export function makeSignUpSchema(t: Translator) {
  return z.object({
    username: usernameField(t),
    fullName: z.string().trim().min(2, t("fullNameMin")).max(150),
    email: z.email(t("invalidEmail")),
    password: passwordField(t),
  });
}

export type SignUpInput = z.infer<ReturnType<typeof makeSignUpSchema>>;

// Sign-in accepts either a username or an email in the same field; the
// server action resolves a username to its email via the
// get_email_by_username() RPC before calling signInWithPassword.
export function makeSignInSchema(t: Translator) {
  return z.object({
    identifier: z.string().trim().min(1, t("identifierRequired")),
    password: z.string().min(1, t("passwordRequired")),
  });
}

export type SignInInput = z.infer<ReturnType<typeof makeSignInSchema>>;

export function makeRequestPasswordResetSchema(t: Translator) {
  return z.object({
    email: z.email(t("invalidEmail")),
  });
}

export function makeResetPasswordSchema(t: Translator) {
  return z
    .object({
      password: passwordField(t),
      confirmPassword: z.string(),
    })
    .refine((data) => data.password === data.confirmPassword, {
      message: t("passwordsMismatch"),
      path: ["confirmPassword"],
    });
}

export type ResetPasswordInput = z.infer<ReturnType<typeof makeResetPasswordSchema>>;
