import { z } from "zod";

const usernameField = z
  .string()
  .trim()
  .min(3, "Username must be at least 3 characters")
  .max(32, "Username must be at most 32 characters")
  .regex(/^[a-zA-Z0-9_.-]+$/, "Only letters, numbers, dots, underscores, and hyphens");

const passwordField = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(128)
  .regex(/[a-z]/, "Include at least one lowercase letter")
  .regex(/[A-Z]/, "Include at least one uppercase letter")
  .regex(/[0-9]/, "Include at least one number");

export const signUpSchema = z.object({
  username: usernameField,
  fullName: z.string().trim().min(2, "Name is too short").max(150),
  email: z.email("Enter a valid email address"),
  password: passwordField,
});

export type SignUpInput = z.infer<typeof signUpSchema>;

// Sign-in accepts either a username or an email in the same field; the
// server action resolves a username to its email via the
// get_email_by_username() RPC before calling signInWithPassword.
export const signInSchema = z.object({
  identifier: z.string().trim().min(1, "Enter your username or email"),
  password: z.string().min(1, "Password is required"),
});

export type SignInInput = z.infer<typeof signInSchema>;

export const requestPasswordResetSchema = z.object({
  email: z.email("Enter a valid email address"),
});

export const resetPasswordSchema = z
  .object({
    password: passwordField,
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords do not match",
    path: ["confirmPassword"],
  });

export type ResetPasswordInput = z.infer<typeof resetPasswordSchema>;
