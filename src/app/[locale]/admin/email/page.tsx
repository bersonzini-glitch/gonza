import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { AdminEmailForm } from "@/components/admin/admin-email-form";
import { sendAdminEmailAction } from "@/lib/actions/admin";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/admin/email">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "adminEmailForm" });
  return { title: t("metaTitle") };
}

export const dynamic = "force-dynamic";

export default async function AdminEmailPage({ params }: PageProps<"/[locale]/admin/email">) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "adminEmailForm" });

  return (
    <div>
      <h2 className="mb-1 font-heading text-2xl font-semibold text-foreground">{t("heading")}</h2>
      <p className="mb-6 text-sm text-muted-foreground">{t("subheading")}</p>
      <AdminEmailForm action={sendAdminEmailAction.bind(null, locale)} />
    </div>
  );
}
