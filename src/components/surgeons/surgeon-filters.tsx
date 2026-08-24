"use client";

import { Search } from "lucide-react";
import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";

import { useRouter } from "@/i18n/navigation";
import { useState, useTransition } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { primarySpecialtyLabels } from "@/lib/format";
import { LANGUAGE_OPTIONS } from "@/lib/validation/surgeon";
import { LATAM_COUNTRIES } from "@/lib/validation/event";

const ANY = "__any__";

export function SurgeonFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [, startTransition] = useTransition();
  const [q, setQ] = useState(searchParams.get("q") ?? "");
  const t = useTranslations("surgeonFilters");
  const tSpecialties = useTranslations("specialties");

  const PRIMARY_SPECIALTY_LABELS = primarySpecialtyLabels(tSpecialties);

  // Base UI's <Select.Value> only resolves a label for the current value from
  // an explicit `items` map passed to <Select.Root> — without it, it falls
  // back to showing the raw stored value (e.g. the ANY sentinel itself).
  const COUNTRY_ITEMS: Record<string, string> = {
    [ANY]: t("anyCountry"),
    ...Object.fromEntries(LATAM_COUNTRIES.map((c) => [c, c])),
  };
  const SPECIALTY_ITEMS: Record<string, string> = {
    [ANY]: t("anySpecialty"),
    ...PRIMARY_SPECIALTY_LABELS,
  };
  const LANGUAGE_ITEMS: Record<string, string> = {
    [ANY]: t("anyLanguage"),
    ...Object.fromEntries(LANGUAGE_OPTIONS.map((l) => [l, l])),
  };

  function updateParam(key: string, value: string | null) {
    const params = new URLSearchParams(searchParams.toString());
    if (value && value !== ANY) params.set(key, value);
    else params.delete(key);
    params.delete("page");
    startTransition(() => router.push(`/surgeons?${params.toString()}`));
  }

  function toggleParam(key: string, checked: boolean) {
    updateParam(key, checked ? "true" : null);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    updateParam("q", q || null);
  }

  return (
    <form
      onSubmit={handleSubmit}
      aria-label={t("formAriaLabel")}
      className="space-y-4 rounded-xl border border-border bg-card p-4 sm:p-5"
    >
      <div className="flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Label htmlFor="q" className="sr-only">
            {t("searchLabel")}
          </Label>
          <Input
            id="q"
            type="search"
            placeholder={t("searchPlaceholder")}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button type="submit">{t("apply")}</Button>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label htmlFor="country" className="mb-1.5 block text-xs">
            {t("countryLabel")}
          </Label>
          <Select
            items={COUNTRY_ITEMS}
            value={searchParams.get("country") ?? ANY}
            onValueChange={(v) => updateParam("country", v)}
          >
            <SelectTrigger id="country" className="w-full">
              <SelectValue placeholder={t("anyCountry")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ANY}>{t("anyCountry")}</SelectItem>
              {LATAM_COUNTRIES.map((c) => (
                <SelectItem key={c} value={c}>
                  {c}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="specialty" className="mb-1.5 block text-xs">
            {t("specialtyLabel")}
          </Label>
          <Select
            items={SPECIALTY_ITEMS}
            value={searchParams.get("specialty") ?? ANY}
            onValueChange={(v) => updateParam("specialty", v)}
          >
            <SelectTrigger id="specialty" className="w-full">
              <SelectValue placeholder={t("anySpecialty")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ANY}>{t("anySpecialty")}</SelectItem>
              {Object.entries(PRIMARY_SPECIALTY_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="col-span-2">
          <Label htmlFor="language" className="mb-1.5 block text-xs">
            {t("languageLabel")}
          </Label>
          <Select
            items={LANGUAGE_ITEMS}
            value={searchParams.get("language") ?? ANY}
            onValueChange={(v) => updateParam("language", v)}
          >
            <SelectTrigger id="language" className="w-full">
              <SelectValue placeholder={t("anyLanguage")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ANY}>{t("anyLanguage")}</SelectItem>
              {LANGUAGE_OPTIONS.map((lang) => (
                <SelectItem key={lang} value={lang}>
                  {lang}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-3 border-t border-border pt-3">
        <div className="flex items-center justify-between">
          <Label htmlFor="inPerson" className="text-sm font-normal">
            {t("inPersonLabel")}
          </Label>
          <Switch
            id="inPerson"
            checked={searchParams.get("inPerson") === "true"}
            onCheckedChange={(checked) => toggleParam("inPerson", checked)}
          />
        </div>
        <div className="flex items-center justify-between">
          <Label htmlFor="telemedicine" className="text-sm font-normal">
            {t("telemedicineLabel")}
          </Label>
          <Switch
            id="telemedicine"
            checked={searchParams.get("telemedicine") === "true"}
            onCheckedChange={(checked) => toggleParam("telemedicine", checked)}
          />
        </div>
      </div>
    </form>
  );
}
