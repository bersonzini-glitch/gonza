import { AlertCircle } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { AuthCard } from "@/components/auth/auth-card";
import { UpdatePasswordForm } from "@/components/auth/update-password-form";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = { title: "Set a new password" };

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
    <AuthCard title="Set a new password" description="Choose a new password for your account.">
      {exchanged ? (
        <UpdatePasswordForm />
      ) : (
        <div className="space-y-4">
          <Alert variant="destructive">
            <AlertCircle className="size-4" />
            <AlertDescription>
              This reset link is invalid or has expired. Please request a new one.
            </AlertDescription>
          </Alert>
          <Link href="/reset-password" className="font-medium text-primary hover:underline">
            Request a new reset link
          </Link>
        </div>
      )}
    </AuthCard>
  );
}
