import createIntlMiddleware from "next-intl/middleware";
import type { NextRequest } from "next/server";

import { routing } from "@/i18n/routing";
import { updateSession } from "@/lib/supabase/proxy";

const intlMiddleware = createIntlMiddleware(routing);

export function proxy(request: NextRequest) {
  const intlResponse = intlMiddleware(request);
  return updateSession(request, intlResponse);
}

export const config = {
  matcher: [
    /*
     * Run on every request except static assets, image optimization files,
     * and the handful of root-level routes that intentionally live outside
     * [locale] (metadata files, generated icons, the Supabase auth
     * callback, the photo proxy) — next-intl's middleware doesn't know
     * these aren't locale-prefixable pages and would otherwise rewrite
     * them to a non-existent /es/... route, 404ing them. Everything else
     * still runs through so the auth cookie is refreshed on normal
     * navigations.
     */
    "/((?!_next/static|_next/image|favicon.ico|icon$|apple-icon$|sitemap.xml|robots.txt|api/|auth/|.*\\.(?:svg|png|jpg|jpeg|webp|ico)$).*)",
  ],
};
