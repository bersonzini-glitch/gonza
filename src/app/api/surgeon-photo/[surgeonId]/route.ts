import { NextResponse } from "next/server";

import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { SURGEON_PHOTOS_BUCKET } from "@/lib/supabase/storage";

// Approved profiles are already public — anyone can see this photo on the
// directory regardless of who's asking, so there's nothing gained by
// re-minting a fresh signed URL (plus a DB round trip) on every single
// request. Caching the redirect for an hour, matching the default
// cacheControl Supabase Storage sets on the object itself at upload time
// (see the .upload() calls in src/lib/actions/{surgeon,admin}.ts), means a
// repeat page view can skip our route — and its DB check and Storage API
// call — entirely.
const PUBLIC_SIGNED_URL_TTL_SECONDS = 60 * 60;
// Draft/pending/suspended photos are only ever shown to their owner or an
// admin, and visibility can change at any moment (e.g. rejection) — kept
// short-lived and explicitly uncacheable so a stale "visible" response is
// never served after that.
const PRIVATE_SIGNED_URL_TTL_SECONDS = 60;

/**
 * Serves a surgeon's profile photo as a redirect to a signed URL. Runs the
 * visibility check itself on every request (approved profile, the owner,
 * or an admin) instead of relying on storage RLS, so an unapproved
 * profile's photo is never reachable by guessing a bucket path — see
 * supabase/migrations/20260822001000_storage.sql for why the bucket
 * intentionally has no public/anon storage policy.
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

  const isPublic = surgeon.status === "approved";
  let visible = isPublic;

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
    const ttl = isPublic ? PUBLIC_SIGNED_URL_TTL_SECONDS : PRIVATE_SIGNED_URL_TTL_SECONDS;
    const { data: signed, error } = await admin.storage
      .from(SURGEON_PHOTOS_BUCKET)
      .createSignedUrl(surgeon.photo_path, ttl);

    if (error || !signed) {
      return NextResponse.json({ error: "Photo unavailable" }, { status: 404 });
    }

    const response = NextResponse.redirect(signed.signedUrl, { status: 302 });
    response.headers.set(
      "Cache-Control",
      isPublic ? `public, max-age=${ttl}` : "private, no-store",
    );
    return response;
  } catch (err) {
    // createAdminClient() throws if SUPABASE_SERVICE_ROLE_KEY isn't set in
    // this environment — surface it as a normal missing-image response
    // instead of an unhandled route error.
    console.error("surgeon-photo route failed unexpectedly:", err);
    return NextResponse.json({ error: "Photo unavailable" }, { status: 500 });
  }
}
