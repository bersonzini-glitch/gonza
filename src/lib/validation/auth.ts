import { z } from "zod";

const usernameField = z
  .string()
  .trim()
  .min(3, "El usuario debe tener al menos 3 caracteres")
  .max(32, "El usuario debe tener como máximo 32 caracteres")
  .regex(/^[a-zA-Z0-9_.-]+$/, "Solo letras, números, puntos, guiones bajos y guiones");

const passwordField = z
  .string()
  .min(8, "La contraseña debe tener al menos 8 caracteres")
  .max(128)
  .regex(/[a-z]/, "Incluí al menos una letra minúscula")
  .regex(/[A-Z]/, "Incluí al menos una letra mayúscula")
  .regex(/[0-9]/, "Incluí al menos un número");

export const signUpSchema = z.object({
  username: usernameField,
  fullName: z.string().trim().min(2, "El nombre es muy corto").max(150),
  email: z.email("Ingresá un email válido"),
  password: passwordField,
});

export type SignUpInput = z.infer<typeof signUpSchema>;

// Sign-in accepts either a username or an email in the same field; the
// server action resolves a username to its email via the
// get_email_by_username() RPC before calling signInWithPassword.
export const signInSchema = z.object({
  identifier: z.string().trim().min(1, "Ingresá tu usuario o email"),
  password: z.string().min(1, "La contraseña es obligatoria"),
});

export type SignInInput = z.infer<typeof signInSchema>;

export const requestPasswordResetSchema = z.object({
  email: z.email("Ingresá un email válido"),
});

export const resetPasswordSchema = z
  .object({
    password: passwordField,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Las contraseñas no coinciden",
    path: ["confirmPassword"],
  });

export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
