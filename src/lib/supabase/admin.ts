import "server-only";

import { createClient as createSupabaseClient } from "@supabase/supabase-js";

import { getServiceRoleKey } from "@/lib/env";
import { publicEnv } from "@/lib/env";
import type { Database } from "@/types/database";

/**
 * Service-role Supabase client. Bypasses Row Level Security entirely.
 *
 * The `server-only` import guarantees a build error if any client
 * component ever imports this module. Use ONLY for:
 *  - the initial-admin provisioning script
 *  - trusted server-side operations that must read/write across users
 *    (e.g. generating a signed URL for an approved surgeon's photo),
 * and always after an explicit, server-verified authorization check —
 * never in response to a client-supplied "isAdmin" flag.
 */
export function createAdminClient() {
  return createSupabaseClient<Database>(publicEnv.NEXT_PUBLIC_SUPABASE_URL, getServiceRoleKey(), {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
