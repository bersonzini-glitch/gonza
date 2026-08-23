import "server-only";

import type { SupabaseClient } from "@supabase/supabase-js";

import type { Database } from "@/types/database";

/**
 * Thin wrapper around the `check_rate_limit` Postgres function (see
 * supabase/migrations/20260822000800_functions_triggers.sql). Records the
 * attempt and returns true when the caller is still under the sliding
 * window limit for (identifier, action); false when it should be rejected.
 */
export async function checkRateLimit(
  supabase: SupabaseClient<Database>,
  identifier: string,
  action: string,
  maxAttempts: number,
  windowSeconds: number,
): Promise<boolean> {
  const { data, error } = await supabase.rpc("check_rate_limit", {
    p_identifier: identifier,
    p_action: action,
    p_max_attempts: maxAttempts,
    p_window_seconds: windowSeconds,
  });

  if (error) {
    // Fail closed on unexpected errors so a broken rate limiter can't be
    // used to bypass abuse protection.
    console.error("Rate limit check failed:", error.message);
    return false;
  }

  return Boolean(data);
}
