import { z } from "zod";

/**
 * Public env vars are validated eagerly (safe to fail fast — they must be
 * present in every environment, including the browser bundle).
 *
 * `SUPABASE_SERVICE_ROLE_KEY` is validated lazily via `getServiceRoleKey()`
 * so that merely importing this module never throws in contexts (like the
 * client bundle) where the variable is intentionally absent.
 */

const publicEnvSchema = z.object({
  NEXT_PUBLIC_SUPABASE_URL: z.url({ message: "NEXT_PUBLIC_SUPABASE_URL must be a valid URL" }),
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: z
    .string()
    .min(1, "NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY is required"),
});

function parsePublicEnv() {
  const parsed = publicEnvSchema.safeParse({
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
    NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
  });

  if (!parsed.success) {
    const issues = parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join(", ");
    throw new Error(
      `Invalid/missing public environment variables (${issues}). Copy .env.example to .env.local and fill in your Supabase project values.`,
    );
  }

  return parsed.data;
}

export const publicEnv = parsePublicEnv();

/** Server-only: never import this from a Client Component. */
export function getServiceRoleKey(): string {
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!key) {
    throw new Error(
      "SUPABASE_SERVICE_ROLE_KEY is not set. It is required for this server-only operation and must never be exposed to the browser.",
    );
  }
  return key;
}
