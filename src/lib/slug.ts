export function slugify(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

interface SlugInsertResult<T> {
  data: T | null;
  error: { code?: string; message?: string } | null;
}

/**
 * Inserts a row with a slug derived from `title`, retrying with a short
 * numeric suffix (`-2`, `-3`, ...) only when the plain slug is already
 * taken — so the common case gets a clean URL instead of always carrying a
 * random suffix "just in case". Retries specifically on the slug's own
 * unique-constraint violation (matched by constraint name containing
 * "slug"); any other error — including an unrelated unique violation, e.g.
 * surgeon_profiles' one-row-per-user constraint — is returned immediately
 * rather than retried, since a different slug wouldn't fix it.
 */
export async function insertWithUniqueSlug<T>(
  title: string,
  tryInsert: (slug: string) => Promise<SlugInsertResult<T>>,
  maxAttempts = 30,
): Promise<SlugInsertResult<T>> {
  const base = slugify(title);
  let result: SlugInsertResult<T> = { data: null, error: null };

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const candidate = attempt === 0 ? base : `${base}-${attempt + 1}`;
    result = await tryInsert(candidate);
    const isSlugConflict =
      result.error?.code === "23505" && result.error.message?.toLowerCase().includes("slug");
    if (!isSlugConflict) return result;
  }
  return result;
}
