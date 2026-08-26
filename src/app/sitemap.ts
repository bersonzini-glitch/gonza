import type { MetadataRoute } from "next";

import { routing } from "@/i18n/routing";
import { createAdminClient } from "@/lib/supabase/admin";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

// Spanish (the default locale) has no URL prefix — see localePrefix:
// "as-needed" in src/i18n/routing.ts — so its canonical URL is the bare
// path, while English/Portuguese get a /en or /pt prefix.
function localizedUrl(path: string, locale: string): string {
  const prefix = locale === routing.defaultLocale ? "" : `/${locale}`;
  return `${SITE_URL}${prefix}${path}`;
}

function entry(
  path: string,
  options: Pick<MetadataRoute.Sitemap[number], "changeFrequency" | "priority" | "lastModified">,
): MetadataRoute.Sitemap[number] {
  const languages = Object.fromEntries(
    routing.locales.map((locale) => [locale, localizedUrl(path, locale)]),
  );
  return {
    url: localizedUrl(path, routing.defaultLocale),
    alternates: { languages: { ...languages, "x-default": localizedUrl(path, routing.defaultLocale) } },
    ...options,
  };
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const admin = createAdminClient();

  const [{ data: events }, { data: surgeons }] = await Promise.all([
    admin.from("events").select("slug, updated_at").eq("status", "approved"),
    admin.from("surgeon_profiles").select("slug, updated_at").eq("status", "approved"),
  ]);

  const staticPages: MetadataRoute.Sitemap = [
    entry("/", { changeFrequency: "daily", priority: 1 }),
    entry("/events", { changeFrequency: "hourly", priority: 0.9 }),
    entry("/surgeons", { changeFrequency: "daily", priority: 0.9 }),
    entry("/societies", { changeFrequency: "weekly", priority: 0.7 }),
    entry("/about", { changeFrequency: "monthly", priority: 0.4 }),
    entry("/contact", { changeFrequency: "monthly", priority: 0.3 }),
    entry("/privacy", { changeFrequency: "yearly", priority: 0.2 }),
    entry("/sign-in", { changeFrequency: "yearly", priority: 0.1 }),
    entry("/sign-up", { changeFrequency: "yearly", priority: 0.1 }),
  ];

  const eventPages: MetadataRoute.Sitemap = (events ?? []).map((e) =>
    entry(`/events/${e.slug}`, {
      lastModified: e.updated_at,
      changeFrequency: "weekly",
      priority: 0.7,
    }),
  );

  const surgeonPages: MetadataRoute.Sitemap = (surgeons ?? []).map((s) =>
    entry(`/surgeons/${s.slug}`, {
      lastModified: s.updated_at,
      changeFrequency: "monthly",
      priority: 0.6,
    }),
  );

  return [...staticPages, ...eventPages, ...surgeonPages];
}
