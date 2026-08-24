import { AlertCircle } from "lucide-react";
import type { Metadata } from "next";
import { Link } from "@/i18n/navigation";

import { AuthCard } from "@/components/auth/auth-card";
import { UpdatePasswordForm } from "@/components/auth/update-password-form";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Definir nueva contraseña" };

export default async function ConfirmResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ code?: string }>;
}) {
  const { code } = await searchParams;
  let exchanged = true;

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    exchanged = !error;
  }

  return (
    <AuthCard
      title="Definí una nueva contraseña"
      description="Elegí una nueva contraseña para tu cuenta."
    >
      {exchanged ? (
        <UpdatePasswordForm />
      ) : (
        <div className="space-y-4">
          <Alert variant="destructive">
            <AlertCircle className="size-4" />
            <AlertDescription>
              Este enlace de recuperación no es válido o expiró. Solicitá uno nuevo.
            </AlertDescription>
          </Alert>
          <Link href="/reset-password" className="font-medium text-primary hover:underline">
            Solicitar un nuevo enlace de recuperación
          </Link>
        </div>
      )}
    </AuthCard>
  );
}
