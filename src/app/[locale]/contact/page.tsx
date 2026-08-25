import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";

import { ContactForm } from "@/components/contact/contact-form";
import { getCurrentProfile } from "@/lib/auth/session";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/contact">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "contact" });
  return { title: t("metaTitle"), description: t("metaDescription") };
}

export default async function ContactPage({ params }: PageProps<"/[locale]/contact">) {
  const { locale } = await params;
  setRequestLocale(locale);
  const [t, profile] = await Promise.all([getTranslations("contact"), getCurrentProfile()]);

  return (
    <div className="mx-auto max-w-xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="font-heading text-3xl font-semibold text-foreground sm:text-4xl">
        {t("pageTitle")}
      </h1>
      <p className="mt-4 text-muted-foreground">{t("intro")}</p>

      <div className="surface-flat mt-8 p-6">
        <ContactForm
          defaultName={profile?.full_name ?? profile?.username}
          defaultEmail={profile?.email ?? undefined}
        />
      </div>
    </div>
  );
}
