import { LayoutDashboard, ShieldCheck, UserRound } from "lucide-react";
import Link from "next/link";

import { SignOutItem } from "@/components/layout/sign-out-item";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { CurrentProfile } from "@/lib/auth/types";

export function UserMenu({ profile }: { profile: CurrentProfile | null }) {
  if (!profile) {
    return (
      <div className="flex items-center gap-2">
        <Button variant="ghost" asChild>
          <Link href="/sign-in">Iniciar sesión</Link>
        </Button>
        <Button asChild>
          <Link href="/sign-up">Sumate como cirujano</Link>
        </Button>
      </div>
    );
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="gap-2">
          <UserRound className="size-4" aria-hidden="true" />
          <span className="max-w-32 truncate">{profile.full_name ?? profile.username}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="truncate">{profile.email}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/dashboard">
            <LayoutDashboard className="size-4" aria-hidden="true" />
            Mi perfil de cirujano
          </Link>
        </DropdownMenuItem>
        {profile.role === "admin" && (
          <DropdownMenuItem asChild>
            <Link href="/admin">
              <ShieldCheck className="size-4" aria-hidden="true" />
              Panel de administración
            </Link>
          </DropdownMenuItem>
        )}
        <DropdownMenuSeparator />
        <SignOutItem />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
