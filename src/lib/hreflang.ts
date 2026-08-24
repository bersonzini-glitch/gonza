import { routing } from "@/i18n/routing";

// Spanish (the default locale) has no URL prefix — see localePrefix:
// "as-needed" in src/i18n/routing.ts — so its path is the bare path,
// while English/Portuguese get a /en or /pt prefix.
export function localizedPath(path: string, locale: string): string {
  const prefix = locale === routing.defaultLocale ? "" : `/${locale}`;
  return `${prefix}${path}`;
}

/** hreflang alternates for a page's <link rel="alternate"> tags, keyed by locale plus x-default. */
export function languageAlternates(path: string): Record<string, string> {
  const languages = Object.fromEntries(
    routing.locales.map((locale) => [locale, localizedPath(path, locale)]),
  );
  return { ...languages, "x-default": localizedPath(path, routing.defaultLocale) };
}
