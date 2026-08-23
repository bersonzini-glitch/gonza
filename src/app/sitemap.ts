import type { MetadataRoute } from "next";

import { createAdminClient } from "@/lib/supabase/admin";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const admin = createAdminClient();

  const [{ data: events }, { data: surgeons }] = await Promise.all([
    admin.from("events").select("slug, updated_at").eq("status", "approved"),
    admin.from("surgeon_profiles").select("slug, updated_at").eq("status", "approved"),
  ]);

  const staticPages: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, changeFrequency: "daily", priority: 1 },
    { url: `${SITE_URL}/events`, changeFrequency: "hourly", priority: 0.9 },
    { url: `${SITE_URL}/surgeons`, changeFrequency: "daily", priority: 0.9 },
    { url: `${SITE_URL}/about`, changeFrequency: "monthly", priority: 0.4 },
    { url: `${SITE_URL}/privacy`, changeFrequency: "yearly", priority: 0.2 },
    { url: `${SITE_URL}/sign-in`, changeFrequency: "yearly", priority: 0.1 },
    { url: `${SITE_URL}/sign-up`, changeFrequency: "yearly", priority: 0.1 },
  ];

  const eventPages: MetadataRoute.Sitemap = (events ?? []).map((e) => ({
    url: `${SITE_URL}/events/${e.slug}`,
    lastModified: e.updated_at,
    changeFrequency: "weekly",
    priority: 0.7,
  }));

  const surgeonPages: MetadataRoute.Sitemap = (surgeons ?? []).map((s) => ({
    url: `${SITE_URL}/surgeons/${s.slug}`,
    lastModified: s.updated_at,
    changeFrequency: "monthly",
    priority: 0.6,
  }));

  return [...staticPages, ...eventPages, ...surgeonPages];
}
