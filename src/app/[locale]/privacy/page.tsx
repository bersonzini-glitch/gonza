import { AlertTriangle } from "lucide-react";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/privacy">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "privacy" });
  return { title: t("metaTitle"), description: t("metaDescription") };
}

export default async function PrivacyPage({ params }: PageProps<"/[locale]/privacy">) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("privacy");

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="font-heading text-3xl font-semibold text-foreground sm:text-4xl">
        {t("pageTitle")}
      </h1>

      <div className="mt-6 flex gap-3 rounded-xl border border-destructive/30 bg-destructive/5 p-5">
        <AlertTriangle className="size-5 shrink-0 text-destructive" aria-hidden="true" />
        <div className="text-sm text-foreground">
          <p className="font-semibold">{t("emergencyTitle")}</p>
          <p className="mt-1 text-muted-foreground">{t("emergencyBody")}</p>
        </div>
      </div>

      <section className="mt-10 space-y-3">
        <h2 className="font-heading text-xl font-semibold text-foreground">
          {t("medicalHeading")}
        </h2>
        <p className="text-muted-foreground">{t("medicalP1")}</p>
        <p className="text-muted-foreground">{t("medicalP2")}</p>
      </section>

      <section className="mt-10 space-y-3">
        <h2 className="font-heading text-xl font-semibold text-foreground">{t("dataHeading")}</h2>
        <ul className="list-disc space-y-2 pl-5 text-muted-foreground">
          <li>
            <strong>{t("dataAccountLabel")}</strong> {t("dataAccountBody")}
          </li>
          <li>
            <strong>{t("dataProfileLabel")}</strong> {t("dataProfileBody")}
          </li>
          <li>
            <strong>{t("dataTechLabel")}</strong> {t("dataTechBody")}
          </li>
        </ul>
      </section>

      <section className="mt-10 space-y-3">
        <h2 className="font-heading text-xl font-semibold text-foreground">
          {t("protectHeading")}
        </h2>
        <p className="text-muted-foreground">{t("protectBody")}</p>
      </section>

      <section className="mt-10 space-y-3">
        <h2 className="font-heading text-xl font-semibold text-foreground">
          {t("choicesHeading")}
        </h2>
        <p className="text-muted-foreground">{t("choicesBody")}</p>
      </section>
    </div>
  );
}
