import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";

import { AuthCard } from "@/components/auth/auth-card";
import { SignInForm } from "@/components/auth/sign-in-form";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/sign-in">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "auth" });
  return { title: t("signInTitle") };
}

export default async function SignInPage({
  params,
  searchParams,
}: PageProps<"/[locale]/sign-in">) {
  const { locale } = await params;
  const rawParams = await searchParams;
  const next = typeof rawParams.next === "string" ? rawParams.next : undefined;
  const t = await getTranslations({ locale, namespace: "auth" });

  return (
    <AuthCard
      title={t("signInTitle")}
      description={t("signInDescription")}
      footer={
        <>
          {t("noAccountYet")}{" "}
          <Link href="/sign-up" className="font-medium text-primary hover:underline">
            {t("createAccount")}
          </Link>
        </>
      }
    >
      <SignInForm next={next} />
    </AuthCard>
  );
}
