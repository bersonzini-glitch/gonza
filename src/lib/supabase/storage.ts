export const SURGEON_PHOTOS_BUCKET = "surgeon-photos";

/**
 * The public-facing URL for a surgeon's photo, if they have one. This is
 * always a same-origin API route — never a direct Supabase Storage URL —
 * so the approval check in src/app/api/surgeon-photo/[surgeonId]/route.ts
 * runs fresh on every request instead of being baked into a signed URL
 * embedded in cached/revalidated HTML.
 *
 * The `v` query param is the current photo's own storage filename (a
 * random UUID minted fresh on every upload — see uploadSurgeonPhotoAction
 * in src/lib/actions/surgeon.ts). It exists purely to change the URL, and
 * therefore the cache key, whenever the photo changes: that route caches
 * its response for an hour, and the old photo file is deleted the moment a
 * new one is uploaded, so a stable URL would keep resolving to a 404 for
 * anyone with the old response cached until it happened to expire. A
 * version bump makes that cached response irrelevant instead — it's simply
 * never requested again once the page renders the new URL.
 */
export function surgeonPhotoUrl(surgeonId: string, photoPath: string | null): string | null {
  if (!photoPath) return null;
  const version = photoPath.split("/").pop();
  return `/api/surgeon-photo/${surgeonId}?v=${encodeURIComponent(version ?? "")}`;
}
