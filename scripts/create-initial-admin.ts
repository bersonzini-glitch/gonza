/**
 * Provisions (or promotes) the initial administrator account from
 * INITIAL_ADMIN_USERNAME / INITIAL_ADMIN_EMAIL / INITIAL_ADMIN_PASSWORD in
 * .env.local. Uses the Supabase service-role key — never run this from
 * client-side code, and never commit real values for these variables.
 *
 * Usage:
 *   npm run setup:admin
 *
 * Safe to re-run: if the account already exists, it is left alone except
 * that its profile is (re-)promoted to role = 'admin' with the configured
 * username.
 */
import { createClient } from "@supabase/supabase-js";

try {
  process.loadEnvFile(".env.local");
} catch {
  // .env.local may not exist in CI, where these vars are injected another way.
}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const ADMIN_USERNAME = process.env.INITIAL_ADMIN_USERNAME;
const ADMIN_EMAIL = process.env.INITIAL_ADMIN_EMAIL;
const ADMIN_PASSWORD = process.env.INITIAL_ADMIN_PASSWORD;

function requireEnv(name: string, value: string | undefined): string {
  if (!value) {
    console.error(`Missing required environment variable: ${name}`);
    console.error("Set it in .env.local (see .env.example) and try again.");
    process.exit(1);
  }
  return value;
}

async function main() {
  const url = requireEnv("NEXT_PUBLIC_SUPABASE_URL", SUPABASE_URL);
  const serviceRoleKey = requireEnv("SUPABASE_SERVICE_ROLE_KEY", SERVICE_ROLE_KEY);
  const username = requireEnv("INITIAL_ADMIN_USERNAME", ADMIN_USERNAME);
  const email = requireEnv("INITIAL_ADMIN_EMAIL", ADMIN_EMAIL);
  const password = requireEnv("INITIAL_ADMIN_PASSWORD", ADMIN_PASSWORD);

  if (password.length < 8) {
    console.error("INITIAL_ADMIN_PASSWORD must be at least 8 characters.");
    process.exit(1);
  }

  const supabase = createClient(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  console.log(`Looking for an existing account for ${email}…`);

  let userId: string | null = null;
  let page = 1;
  const perPage = 200;
  while (userId === null) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage });
    if (error) throw new Error(`Failed to list users: ${error.message}`);
    const match = data.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
    if (match) userId = match.id;
    if (data.users.length < perPage) break;
    page += 1;
  }

  if (userId) {
    console.log(`Found existing account (${userId}). Promoting to admin…`);
  } else {
    console.log("No existing account found. Creating one…");
    const { data, error } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { username, full_name: "Administrator" },
    });
    if (error || !data.user) {
      throw new Error(`Failed to create admin user: ${error?.message}`);
    }
    userId = data.user.id;
    console.log(`Created account ${userId}.`);
  }

  // handle_new_user() already created the profiles row for a brand-new
  // account; upsert covers both that case and the "existing account"
  // case in one step.
  const { error: profileError } = await supabase
    .from("profiles")
    .upsert(
      { id: userId, username, full_name: "Administrator", role: "admin" },
      { onConflict: "id" },
    );

  if (profileError) {
    throw new Error(`Failed to promote account to admin: ${profileError.message}`);
  }

  console.log("");
  console.log("✅ Initial administrator is ready.");
  console.log(`   Sign in at /sign-in with username "${username}" (or the email) and the`);
  console.log("   password configured in INITIAL_ADMIN_PASSWORD.");
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
