import type { MetadataRoute } from "next";

import { routing } from "@/i18n/routing";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

const PRIVATE_PATHS = ["/dashboard", "/admin", "/api/", "/auth/", "/reset-password/confirm"];

// Spanish (the default locale) has no URL prefix, so its private paths are
// the bare paths above; English/Portuguese need the same paths repeated
// under their /en and /pt prefix.
const disallow = PRIVATE_PATHS.flatMap((path) => [
  path,
  ...routing.locales
    .filter((locale) => locale !== routing.defaultLocale)
    .map((locale) => `/${locale}${path}`),
]);

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow,
      },
    ],
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
