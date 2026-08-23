"use client";

import { LogOut } from "lucide-react";
import { useTransition } from "react";

import { Button } from "@/components/ui/button";
import { signOutAction } from "@/lib/actions/auth";

export function SignOutButton({ className }: { className?: string }) {
  const [isPending, startTransition] = useTransition();

  return (
    <Button
      type="button"
      variant="outline"
      className={className}
      disabled={isPending}
      onClick={() => startTransition(() => void signOutAction())}
    >
      <LogOut className="size-4" aria-hidden="true" />
      {isPending ? "Cerrando sesión…" : "Cerrar sesión"}
    </Button>
  );
}
