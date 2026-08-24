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
     * Run on every request except static assets and image optimization
     * files, so the auth cookie is refreshed on normal navigations without
     * doing unnecessary work on Next.js internals.
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|webp|ico)$).*)",
  ],
};
