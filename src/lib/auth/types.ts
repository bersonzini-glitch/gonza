import type { Database } from "@/types/database";

// Deliberately in its own module (no "server-only" import) so Client
// Components can import this type without pulling the server-only
// session-fetching code (src/lib/auth/session.ts) into the client bundle.
export type CurrentProfile = Database["public"]["Tables"]["profiles"]["Row"] & {
  email: string | null;
};
