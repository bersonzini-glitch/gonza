export const SURGEON_PHOTOS_BUCKET = "surgeon-photos";

/**
 * The public-facing URL for a surgeon's photo, if they have one. This is
 * always a same-origin API route — never a direct Supabase Storage URL —
 * so the approval check in src/app/api/surgeon-photo/[surgeonId]/route.ts
 * runs fresh on every request instead of being baked into a signed URL
 * embedded in cached/revalidated HTML.
 */
export function surgeonPhotoUrl(surgeonId: string, hasPhoto: boolean): string | null {
  return hasPhoto ? `/api/surgeon-photo/${surgeonId}` : null;
}
