import { UserX } from "lucide-react";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";

import { FadeIn } from "@/components/shared/fade-in";
import { SurgeonCard } from "@/components/surgeons/surgeon-card";
import { SurgeonFilters } from "@/components/surgeons/surgeon-filters";
import { Button } from "@/components/ui/button";
import { searchSurgeons } from "@/lib/data/surgeons";
import { surgeonSearchSchema } from "@/lib/validation/surgeon";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/surgeons">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "surgeonsPage" });
  return { title: t("metaTitle"), description: t("metaDescription") };
}

export default async function SurgeonsPage({
  params,
  searchParams,
}: PageProps<"/[locale]/surgeons">) {
  const { locale } = await params;
  const rawParams = await searchParams;
  const parsed = surgeonSearchSchema.safeParse(rawParams);
  const filters = parsed.success ? parsed.data : surgeonSearchSchema.parse({});

  const { surgeons, total, page, pageSize } = await searchSurgeons(filters);
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const t = await getTranslations({ locale, namespace: "surgeonsPage" });

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="max-w-2xl">
        <h1 className="font-heading text-3xl font-semibold text-foreground sm:text-4xl">
          {t("heading")}
        </h1>
        <p className="mt-2 text-muted-foreground">
          {t("resultsCount", { count: total })}{" "}
          <Link href="/privacy" className="text-primary hover:underline">
            {t("readDisclaimer")}
          </Link>
          .
        </p>
      </div>

      <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-[280px_1fr]">
        <aside className="lg:sticky lg:top-20 lg:self-start">
          <SurgeonFilters />
        </aside>

        <div>
          {surgeons.length === 0 ? (
            <div className="rounded-xl border border-dashed border-border p-12 text-center">
              <UserX className="mx-auto size-10 text-muted-foreground" aria-hidden="true" />
              <h2 className="mt-4 font-heading text-xl font-semibold text-foreground">
                {t("emptyHeading")}
              </h2>
              <p className="mt-2 text-muted-foreground">{t("emptyBody")}</p>
              <Button variant="outline" className="mt-5" asChild>
                <Link href="/surgeons">{t("clearFilters")}</Link>
              </Button>
            </div>
          ) : (
            <>
              <ul className="grid grid-cols-1 gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {surgeons.map((surgeon, i) => (
                  <FadeIn as="li" delay={i * 0.03} key={surgeon.id}>
                    <SurgeonCard surgeon={surgeon} />
                  </FadeIn>
                ))}
              </ul>

              {totalPages > 1 && (
                <nav
                  aria-label={t("paginationLabel")}
                  className="mt-10 flex items-center justify-center gap-3"
                >
                  <Button variant="outline" disabled={page <= 1} asChild={page > 1}>
                    {page > 1 ? (
                      <Link href={buildHref(rawParams, page - 1)}>{t("previous")}</Link>
                    ) : (
                      <span>{t("previous")}</span>
                    )}
                  </Button>
                  <span className="text-sm text-muted-foreground">
                    {t("pageOf", { page, totalPages })}
                  </span>
                  <Button
                    variant="outline"
                    disabled={page >= totalPages}
                    asChild={page < totalPages}
                  >
                    {page < totalPages ? (
                      <Link href={buildHref(rawParams, page + 1)}>{t("next")}</Link>
                    ) : (
                      <span>{t("next")}</span>
                    )}
                  </Button>
                </nav>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function buildHref(rawParams: Record<string, string | string[] | undefined>, page: number): string {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(rawParams)) {
    if (typeof value === "string" && key !== "page") params.set(key, value);
  }
  params.set("page", String(page));
  return `/surgeons?${params.toString()}`;
}
