import { NextResponse } from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { SURGEON_PHOTOS_BUCKET } from "@/lib/supabase/storage";

const SIGNED_URL_TTL_SECONDS = 60;

/**
 * Serves a surgeon's profile photo as a redirect to a fresh, short-lived
 * signed URL. Runs the visibility check itself on every request (approved
 * profile, the owner, or an admin) instead of relying on storage RLS, so
 * an unapproved profile's photo is never reachable by guessing a bucket
 * path — see supabase/migrations/20260822001000_storage.sql for why the
 * bucket intentionally has no public/anon storage policy.
 */
export async function GET(
  _request: Request,
  context: RouteContext<"/api/surgeon-photo/[surgeonId]">,
) {
  const { surgeonId } = await context.params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: surgeon } = await supabase
    .from("surgeon_profiles")
    .select("id, user_id, status, photo_path")
    .eq("id", surgeonId)
    .maybeSingle();

  if (!surgeon || !surgeon.photo_path) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  let visible = surgeon.status === "approved";

  if (!visible && user) {
    if (surgeon.user_id === user.id) {
      visible = true;
    } else {
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .maybeSingle();
      visible = profile?.role === "admin";
    }
  }

  if (!visible) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  try {
    const admin = createAdminClient();
    const { data: signed, error } = await admin.storage
      .from(SURGEON_PHOTOS_BUCKET)
      .createSignedUrl(surgeon.photo_path, SIGNED_URL_TTL_SECONDS);

    if (error || !signed) {
      return NextResponse.json({ error: "Photo unavailable" }, { status: 404 });
    }

    return NextResponse.redirect(signed.signedUrl, { status: 302 });
  } catch (err) {
    // createAdminClient() throws if SUPABASE_SERVICE_ROLE_KEY isn't set in
    // this environment — surface it as a normal missing-image response
    // instead of an unhandled route error.
    console.error("surgeon-photo route failed unexpectedly:", err);
    return NextResponse.json({ error: "Photo unavailable" }, { status: 500 });
  }
}
