import type { Metadata } from "next";
import { Link } from "@/i18n/navigation";

import { AuthCard } from "@/components/auth/auth-card";
import { SignInForm } from "@/components/auth/sign-in-form";

export const metadata: Metadata = { title: "Iniciar sesión" };

export default async function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  const { next } = await searchParams;

  return (
    <AuthCard
      title="Iniciar sesión"
      description="Accedé a tu perfil de cirujano y tus envíos."
      footer={
        <>
          ¿Sos nuevo acá?{" "}
          <Link href="/sign-up" className="font-medium text-primary hover:underline">
            Creá una cuenta
          </Link>
        </>
      }
    >
      <SignInForm next={next} />
    </AuthCard>
  );
}
