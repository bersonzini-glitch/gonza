"use client";

import { LogOut } from "lucide-react";
import { useTransition } from "react";

import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { signOutAction } from "@/lib/actions/auth";

export function SignOutItem() {
  const [isPending, startTransition] = useTransition();

  return (
    <DropdownMenuItem
      variant="destructive"
      disabled={isPending}
      onClick={() => {
        startTransition(() => {
          void signOutAction();
        });
      }}
    >
      <LogOut className="size-4" aria-hidden="true" />
      {isPending ? "Cerrando sesión…" : "Cerrar sesión"}
    </DropdownMenuItem>
  );
}
