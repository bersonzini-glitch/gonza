import { BookOpenCheck, Database, ShieldCheck, Users } from "lucide-react";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/about">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "about" });
  return { title: t("metaTitle"), description: t("metaDescription") };
}

export default async function AboutPage({ params }: PageProps<"/[locale]/about">) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("about");

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="font-heading text-3xl font-semibold text-foreground sm:text-4xl">
        {t("pageTitle")}
      </h1>
      <p className="mt-4 text-lg text-muted-foreground">{t("intro")}</p>

      <section className="mt-12">
        <h2 className="flex items-center gap-2 font-heading text-xl font-semibold text-foreground">
          <Database className="size-5 text-primary" aria-hidden="true" />
          {t("methodologyHeading")}
        </h2>
        <div className="mt-3 space-y-3 text-muted-foreground">
          <p>{t("methodologyP1")}</p>
          <p>{t("methodologyP2")}</p>
          <p>{t("methodologyP3")}</p>
        </div>
      </section>

      <section className="mt-12">
        <h2 className="flex items-center gap-2 font-heading text-xl font-semibold text-foreground">
          <Users className="size-5 text-primary" aria-hidden="true" />
          {t("directoryHeading")}
        </h2>
        <div className="mt-3 space-y-3 text-muted-foreground">
          <p>{t.rich("directoryP1", { strong: (chunks) => <strong>{chunks}</strong> })}</p>
          <p>{t("directoryP2")}</p>
          <p>{t("directoryP3")}</p>
        </div>
      </section>

      <section className="mt-12">
        <h2 className="flex items-center gap-2 font-heading text-xl font-semibold text-foreground">
          <ShieldCheck className="size-5 text-primary" aria-hidden="true" />
          {t("securityHeading")}
        </h2>
        <div className="mt-3 space-y-3 text-muted-foreground">
          <p>{t("securityP1")}</p>
          <p>{t("securityP2")}</p>
        </div>
      </section>

      <section className="mt-12">
        <h2 className="flex items-center gap-2 font-heading text-xl font-semibold text-foreground">
          <BookOpenCheck className="size-5 text-primary" aria-hidden="true" />
          {t("correctionsHeading")}
        </h2>
        <p className="mt-3 text-muted-foreground">{t("correctionsBody")}</p>
      </section>
    </div>
  );
}
