import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

import { routing } from "@/i18n/routing";
import { publicEnv } from "@/lib/env";

const PROTECTED_PREFIXES = ["/dashboard", "/admin"];
const LOCALES: readonly string[] = routing.locales;

function matchLocalePrefix(pathname: string): string | null {
  const match = pathname.match(/^\/([a-z]{2})(\/|$)/);
  return match && LOCALES.includes(match[1]) ? match[1] : null;
}

function stripLocalePrefix(pathname: string): string {
  const locale = matchLocalePrefix(pathname);
  if (!locale) return pathname;
  return pathname.slice(locale.length + 1) || "/";
}

/**
 * Refreshes the Supabase session on every request and blocks
 * unauthenticated access to protected route prefixes before any page
 * code runs. Admin-role checks still happen again server-side per page
 * (see src/lib/auth/require-admin.ts) — this is a fast, coarse gate, not
 * the source of truth for authorization.
 *
 * `base` is next-intl's middleware response (a locale redirect/rewrite or
 * a plain pass-through) — cookies get written onto that same response
 * instead of a fresh one, so the locale decision it made survives.
 */
export async function updateSession(request: NextRequest, base?: NextResponse) {
  const response = base ?? NextResponse.next({ request });

  const supabase = createServerClient(
    publicEnv.NEXT_PUBLIC_SUPABASE_URL,
    publicEnv.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          for (const { name, value, options } of cookiesToSet) {
            response.cookies.set(name, value, options);
          }
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const pathWithoutLocale = stripLocalePrefix(request.nextUrl.pathname);
  const isProtected = PROTECTED_PREFIXES.some((prefix) => pathWithoutLocale.startsWith(prefix));

  if (isProtected && !user) {
    const locale = matchLocalePrefix(request.nextUrl.pathname);
    const localePrefix = locale && locale !== routing.defaultLocale ? `/${locale}` : "";
    const redirectUrl = new URL(`${localePrefix}/sign-in`, request.url);
    redirectUrl.searchParams.set("next", request.nextUrl.pathname);
    return NextResponse.redirect(redirectUrl);
  }

  return response;
}
