import type { Metadata } from "next";
import { Link } from "@/i18n/navigation";

import { AuthCard } from "@/components/auth/auth-card";
import { RequestResetForm } from "@/components/auth/request-reset-form";

export const metadata: Metadata = { title: "Recuperar contraseña" };

export default function ResetPasswordPage() {
  return (
    <AuthCard
      title="Recuperá tu contraseña"
      description="Ingresá tu email y te enviaremos un enlace para definir una nueva contraseña."
      footer={
        <>
          ¿La recordaste?{" "}
          <Link href="/sign-in" className="font-medium text-primary hover:underline">
            Iniciar sesión
          </Link>
        </>
      }
    >
      <RequestResetForm />
    </AuthCard>
  );
}
