import type { Metadata } from "next";
import { Link } from "@/i18n/navigation";

import { AuthCard } from "@/components/auth/auth-card";
import { SignUpForm } from "@/components/auth/sign-up-form";

export const metadata: Metadata = { title: "Creá tu cuenta" };

export default function SignUpPage() {
  return (
    <AuthCard
      title="Creá tu cuenta de cirujano"
      description="Registrate para enviar y administrar tu perfil en el directorio de cirujanos de columna de LATAM."
      footer={
        <>
          ¿Ya tenés una cuenta?{" "}
          <Link href="/sign-in" className="font-medium text-primary hover:underline">
            Iniciar sesión
          </Link>
        </>
      }
    >
      <SignUpForm />
    </AuthCard>
  );
}
