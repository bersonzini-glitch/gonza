"use client";

import { Languages } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { usePathname, useRouter } from "@/i18n/navigation";
import { type AppLocale, routing } from "@/i18n/routing";

const LOCALE_LABELS: Record<AppLocale, string> = {
  es: "Español",
  en: "English",
  pt: "Português",
};

export function LanguageToggle() {
  const locale = useLocale() as AppLocale;
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const t = useTranslations("common");

  useEffect(() => {
    // Same mount-guard as ThemeToggle: useLocale() can briefly mismatch
    // between server and client during hydration.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);

  if (!mounted) {
    return <Button variant="ghost" size="icon" aria-label={t("changeLanguage")} disabled />;
  }

  const query = searchParams.toString();
  const target = query ? `${pathname}?${query}` : pathname;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" aria-label={t("changeLanguage")}>
          <Languages className="size-4.5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-36">
        {routing.locales.map((l) => (
          <DropdownMenuItem
            key={l}
            data-active={l === locale}
            className="data-[active=true]:font-semibold data-[active=true]:text-primary"
            onClick={() => router.replace(target, { locale: l })}
          >
            {LOCALE_LABELS[l]}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
