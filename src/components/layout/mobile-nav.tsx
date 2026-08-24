"use client";

import { LayoutDashboard, Menu, ShieldCheck } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { useState } from "react";

import { NAV_LINKS } from "@/lib/nav-links";
import { SignOutButton } from "@/components/layout/sign-out-button";
import { NavLink } from "@/components/shared/nav-link";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Link, usePathname, useRouter } from "@/i18n/navigation";
import { type AppLocale, routing } from "@/i18n/routing";
import type { CurrentProfile } from "@/lib/auth/types";
import { cn } from "@/lib/utils";

const LOCALE_LABELS: Record<AppLocale, string> = { es: "ES", en: "EN", pt: "PT" };

export function MobileNav({ profile }: { profile: CurrentProfile | null }) {
  const [open, setOpen] = useState(false);
  const locale = useLocale() as AppLocale;
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const query = searchParams.toString();
  const target = query ? `${pathname}?${query}` : pathname;
  const t = useTranslations("nav");
  const tUser = useTranslations("userMenu");
  const tCommon = useTranslations("common");

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="md:hidden" aria-label={t("openMenu")}>
          <Menu className="size-5" />
        </Button>
      </SheetTrigger>
      <SheetContent side="right" className="w-72">
        <SheetHeader>
          <SheetTitle>{t("menu")}</SheetTitle>
        </SheetHeader>
        <div className="flex items-center justify-between gap-1 px-4 pb-2">
          <span className="text-xs font-medium text-muted-foreground">
            {tCommon("language")}
          </span>
          <div className="flex gap-1">
            {routing.locales.map((l) => (
              <button
                key={l}
                type="button"
                onClick={() => router.replace(target, { locale: l })}
                className={cn(
                  "rounded-md px-2 py-1 text-xs font-medium",
                  l === locale
                    ? "bg-secondary text-foreground"
                    : "text-muted-foreground hover:bg-secondary/60",
                )}
              >
                {LOCALE_LABELS[l]}
              </button>
            ))}
          </div>
        </div>

        <nav aria-label={t("mobileLabel")} className="flex flex-col gap-1 px-4">
          {NAV_LINKS.map((link) => (
            <SheetClose asChild key={link.href}>
              <NavLink
                href={link.href}
                className="rounded-md px-3 py-2.5 text-sm font-medium text-foreground hover:bg-secondary"
                activeClassName="bg-secondary text-primary"
              >
                {t(link.labelKey)}
              </NavLink>
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
                  <LayoutDashboard className="size-4" /> {tUser("dashboard")}
                </Link>
              </SheetClose>
              {profile.role === "admin" && (
                <SheetClose asChild>
                  <Link
                    href="/admin"
                    className="flex items-center gap-2 rounded-md px-3 py-2.5 text-sm font-medium text-foreground hover:bg-secondary"
                  >
                    <ShieldCheck className="size-4" /> {tUser("admin")}
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
                  <Link href="/sign-in">{tUser("signIn")}</Link>
                </Button>
              </SheetClose>
              <SheetClose asChild>
                <Button asChild>
                  <Link href="/sign-up">{tUser("signUp")}</Link>
                </Button>
              </SheetClose>
            </div>
          )}
        </nav>
      </SheetContent>
    </Sheet>
  );
}
