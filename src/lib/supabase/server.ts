import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

import { publicEnv } from "@/lib/env";
import type { Database } from "@/types/database";

/**
 * Server Supabase client for Server Components, Server Actions, and Route
 * Handlers. Reads/writes the auth cookie via Next's cookies() store, so
 * the caller's session (and therefore RLS identity) is always the real
 * signed-in user — never a client-controlled flag.
 *
 * In a Server Component, `cookies().set()` throws (Server Components
 * can't set cookies); we swallow that because the proxy (src/proxy.ts)
 * already refreshes the session on every request.
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    publicEnv.NEXT_PUBLIC_SUPABASE_URL,
    publicEnv.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            for (const { name, value, options } of cookiesToSet) {
              cookieStore.set(name, value, options);
            }
          } catch {
            // Called from a Server Component — safe to ignore, the
            // proxy handles session refresh for us.
          }
        },
      },
    },
  );
}
