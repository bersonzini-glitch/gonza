"use client";

import { LayoutDashboard, Menu, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

import { NAV_LINKS } from "@/lib/nav-links";
import { SignOutButton } from "@/components/layout/sign-out-button";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import type { CurrentProfile } from "@/lib/auth/types";

export function MobileNav({ profile }: { profile: CurrentProfile | null }) {
  const [open, setOpen] = useState(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden" aria-label="Abrir menú">
          <Menu className="size-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-72">
        <SheetHeader>
          <SheetTitle>Menú</SheetTitle>
        </SheetHeader>
        <nav aria-label="Móvil" className="flex flex-col gap-1 px-4">
          {NAV_LINKS.map((link) => (
            <SheetClose asChild key={link.href}>
              <Link
                href={link.href}
                className="rounded-md px-3 py-2.5 text-sm font-medium text-foreground hover:bg-secondary"
              >
                {link.label}
              </Link>
            </SheetClose>
          ))}

          <div className="my-2 border-t border-border" />

          {profile ? (
            <>
              <SheetClose asChild>
                <Link
                  href="/dashboard"
                  className="flex items-center gap-2 rounded-md px-3 py-2.5 text-sm font-medium text-foreground hover:bg-secondary"
                >
                  <LayoutDashboard className="size-4" /> Mi perfil de cirujano
                </Link>
              </SheetClose>
              {profile.role === "admin" && (
                <SheetClose asChild>
                  <Link
                    href="/admin"
                    className="flex items-center gap-2 rounded-md px-3 py-2.5 text-sm font-medium text-foreground hover:bg-secondary"
                  >
                    <ShieldCheck className="size-4" /> Panel de administración
                  </Link>
                </SheetClose>
              )}
              <div className="px-1">
                <SignOutButton className="w-full" />
              </div>
            </>
          ) : (
            <div className="flex flex-col gap-2 px-1 pt-1">
              <SheetClose asChild>
                <Button variant="outline" asChild>
                  <Link href="/sign-in">Iniciar sesión</Link>
                </Button>
              </SheetClose>
              <SheetClose asChild>
                <Button asChild>
                  <Link href="/sign-up">Sumate como cirujano</Link>
                </Button>
              </SheetClose>
            </div>
          )}
        </nav>
      </SheetContent>
    </Sheet>
  );
}
