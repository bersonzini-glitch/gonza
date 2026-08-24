"use client";

import { LogOut } from "lucide-react";
import { useTranslations } from "next-intl";
import { useTransition } from "react";

import { DropdownMenuItem } from "@/components/ui/dropdown-menu";
import { signOutAction } from "@/lib/actions/auth";

export function SignOutItem() {
  const [isPending, startTransition] = useTransition();
  const t = useTranslations("userMenu");

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
      {isPending ? t("signingOut") : t("signOut")}
    </DropdownMenuItem>
  );
}
