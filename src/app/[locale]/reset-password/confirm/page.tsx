import { AlertCircle } from "lucide-react";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";

import { AuthCard } from "@/components/auth/auth-card";
import { UpdatePasswordForm } from "@/components/auth/update-password-form";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { createClient } from "@/lib/supabase/server";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/reset-password/confirm">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "auth" });
  return { title: t("confirmResetTitle") };
}

export default async function ConfirmResetPasswordPage({
  params,
  searchParams,
}: PageProps<"/[locale]/reset-password/confirm">) {
  const { locale } = await params;
  const rawParams = await searchParams;
  const code = typeof rawParams.code === "string" ? rawParams.code : undefined;
  const t = await getTranslations({ locale, namespace: "auth" });
  let exchanged = true;

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    exchanged = !error;
  }

  return (
    <AuthCard title={t("confirmResetTitle")} description={t("confirmResetDescription")}>
      {exchanged ? (
        <UpdatePasswordForm />
      ) : (
        <div className="space-y-4">
          <Alert variant="destructive">
            <AlertCircle className="size-4" />
            <AlertDescription>{t("invalidResetLink")}</AlertDescription>
          </Alert>
          <Link href="/reset-password" className="font-medium text-primary hover:underline">
            {t("requestNewResetLink")}
          </Link>
        </div>
      )}
    </AuthCard>
  );
}
