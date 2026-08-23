import "server-only";

import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import type { CurrentProfile } from "@/lib/auth/types";

export type { CurrentProfile };

/** Returns the signed-in user's profile row, or null if not signed in. */
export async function getCurrentProfile(): Promise<CurrentProfile | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data: profile } = await supabase.from("profiles").select("*").eq("id", user.id).single();

  if (!profile) return null;

  return { ...profile, email: user.email ?? null };
}

/** Redirects to sign-in when unauthenticated. Use in protected pages. */
export async function requireUser(nextPath: string): Promise<CurrentProfile> {
  const profile = await getCurrentProfile();
  if (!profile) {
    redirect(`/sign-in?next=${encodeURIComponent(nextPath)}`);
  }
  return profile;
}

/**
 * Redirects non-admins away. The role check reads `profiles.role` from
 * the database (through RLS, as the current authenticated user) rather
 * than trusting any client-supplied value.
 */
export async function requireAdmin(nextPath: string): Promise<CurrentProfile> {
  const profile = await requireUser(nextPath);
  if (profile.role !== "admin") {
    redirect("/");
  }
  return profile;
}
