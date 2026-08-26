import { ExternalLink, Globe2 } from "lucide-react";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { notFound } from "next/navigation";

import { FadeIn } from "@/components/shared/fade-in";
import { SocietyCard } from "@/components/societies/society-card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getRelatedSocieties, getSocietyBySlug } from "@/lib/data/societies";
import { languageAlternates, localizedPath } from "@/lib/hreflang";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/societies/[slug]">): Promise<Metadata> {
  const { slug, locale } = await params;
  const society = await getSocietyBySlug(slug);
  if (!society) return {};

  const description = society.description.slice(0, 155);

  return {
    title: society.name,
    description,
    alternates: {
      canonical: localizedPath(`/societies/${society.slug}`, locale),
      languages: languageAlternates(`/societies/${society.slug}`),
    },
    openGraph: {
      title: society.name,
      description,
      type: "article",
      url: `${SITE_URL}/societies/${society.slug}`,
      images: [{ url: `${SITE_URL}/api/og`, width: 1200, height: 630, alt: "ColumnaLATAM" }],
    },
  };
}

export default async function SocietyDetailPage({
  params,
}: PageProps<"/[locale]/societies/[slug]">) {
  const { slug, locale } = await params;
  setRequestLocale(locale);
  const society = await getSocietyBySlug(slug);
  if (!society) notFound();

  const relatedSocieties = await getRelatedSocieties(society);

  const [t, tNav] = await Promise.all([
    getTranslations("societyDetail"),
    getTranslations("nav"),
  ]);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "MedicalOrganization",
    name: society.name,
    url: society.website_url,
    description: society.description,
    ...(society.country !== "Internacional"
      ? { address: { "@type": "PostalAddress", addressCountry: society.country } }
      : {}),
    image: [`${SITE_URL}/api/og`],
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <nav aria-label={tNav("primaryLabel")} className="text-sm text-muted-foreground">
        <Link href="/societies" className="hover:text-foreground">
          {tNav("societies")}
        </Link>
        <span className="mx-1.5">/</span>
        <span className="text-foreground">{society.name}</span>
      </nav>

      <FadeIn>
        <h1 className="mt-3 font-heading text-3xl font-semibold leading-tight text-foreground sm:text-4xl">
          {society.name}
        </h1>

        <p className="mt-3 flex items-center gap-1.5 text-sm text-muted-foreground">
          <Globe2 className="size-4 shrink-0" aria-hidden="true" />
          {society.country}
        </p>

        {society.specialties.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-1.5">
            {society.specialties.map((s) => (
              <Badge key={s} variant="secondary">
                {s}
              </Badge>
            ))}
          </div>
        )}

        <div className="mt-6">
          <Button asChild>
            <a href={society.website_url} target="_blank" rel="noopener noreferrer">
              {t("officialSite")}
              <ExternalLink className="size-4" aria-hidden="true" />
            </a>
          </Button>
        </div>

        <div className="prose prose-neutral dark:prose-invert mt-10 max-w-none">
          <h2 className="font-heading text-xl font-semibold text-foreground">
            {t("aboutHeading")}
          </h2>
          <p className="whitespace-pre-line text-muted-foreground">{society.description}</p>
        </div>
      </FadeIn>

      {relatedSocieties.length > 0 && (
        <section className="mt-14">
          <h2 className="font-heading text-xl font-semibold text-foreground">
            {t("relatedHeading")}
          </h2>
          <ul className="mt-5 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {relatedSocieties.map((related) => (
              <li key={related.id}>
                <SocietyCard society={related} />
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}
