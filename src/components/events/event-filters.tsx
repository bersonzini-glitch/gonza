"use client";

import { Search } from "lucide-react";
import { useTranslations } from "next-intl";
import { useSearchParams } from "next/navigation";

import { useRouter } from "@/i18n/navigation";
import { useState, useTransition } from "react";

import { SearchDisclosure } from "@/components/shared/search-disclosure";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { eventFormatLabels, eventTypeLabels } from "@/lib/format";
import { EVENT_TOPICS, LANGUAGE_OPTIONS, LATAM_COUNTRIES } from "@/lib/validation/event";

const ANY = "__any__";

export function EventFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [q, setQ] = useState(searchParams.get("q") ?? "");
  const [from, setFrom] = useState(searchParams.get("from") ?? "");
  const [to, setTo] = useState(searchParams.get("to") ?? "");
  const t = useTranslations("eventFilters");
  const tEventTypes = useTranslations("eventTypes");
  const tEventFormats = useTranslations("eventFormats");

  const EVENT_TYPE_LABELS = eventTypeLabels(tEventTypes);
  const EVENT_FORMAT_LABELS = eventFormatLabels(tEventFormats);

  const SORT_OPTIONS = [
    { value: "soonest", label: t("sortSoonest") },
    { value: "recently_added", label: t("sortRecentlyAdded") },
    { value: "alphabetical", label: t("sortAlphabetical") },
  ] as const;

  // Base UI's <Select.Value> only resolves a label for the current value from
  // an explicit `items` map passed to <Select.Root> — without it, it falls
  // back to showing the raw stored value (e.g. the ANY sentinel itself).
  const COUNTRY_ITEMS: Record<string, string> = {
    [ANY]: t("anyCountry"),
    ...Object.fromEntries(LATAM_COUNTRIES.map((c) => [c, c])),
  };
  const EVENT_TYPE_ITEMS: Record<string, string> = {
    [ANY]: t("anyType"),
    ...EVENT_TYPE_LABELS,
  };
  const FORMAT_ITEMS: Record<string, string> = {
    [ANY]: t("anyFormat"),
    ...EVENT_FORMAT_LABELS,
  };
  const TOPIC_ITEMS: Record<string, string> = {
    [ANY]: t("anyTopic"),
    ...Object.fromEntries(EVENT_TOPICS.map((topic) => [topic, topic])),
  };
  const LANGUAGE_ITEMS: Record<string, string> = {
    [ANY]: t("anyLanguage"),
    ...Object.fromEntries(LANGUAGE_OPTIONS.map((l) => [l, l])),
  };
  const SORT_ITEMS: Record<string, string> = Object.fromEntries(
    SORT_OPTIONS.map((o) => [o.value, o.label]),
  );

  function updateParam(key: string, value: string | null) {
    const params = new URLSearchParams(searchParams.toString());
    if (value && value !== ANY) params.set(key, value);
    else params.delete(key);
    params.delete("page");
    startTransition(() => router.push(`/events?${params.toString()}`));
  }

  function toggleParam(key: string, checked: boolean) {
    updateParam(key, checked ? "true" : null);
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams(searchParams.toString());
    if (q) params.set("q", q);
    else params.delete("q");
    if (from) params.set("from", from);
    else params.delete("from");
    if (to) params.set("to", to);
    else params.delete("to");
    params.delete("page");
    startTransition(() => router.push(`/events?${params.toString()}`));
  }

  const hasActiveFilters = Array.from(searchParams.keys()).some((k) => k !== "page");

  return (
    <SearchDisclosure
      label={t("openSearch")}
      hideLabel={t("hideSearch")}
      startOpen={hasActiveFilters}
    >
      <form
        onSubmit={handleSubmit}
        aria-label={t("formAriaLabel")}
        className="space-y-4 rounded-xl border border-border bg-card p-4 sm:p-5"
      >
        <div className="flex flex-col gap-2 sm:flex-row">
          <div className="flex-1">
            <Label htmlFor="q" className="sr-only">
              {t("searchLabel")}
            </Label>
            <div className="relative">
              <Search
                className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
                aria-hidden="true"
              />
              <Input
                id="q"
                type="search"
                placeholder={t("searchPlaceholder")}
                value={q}
                onChange={(e) => setQ(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
          <Button type="submit" disabled={isPending}>
            {t("apply")}
          </Button>
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
            <Label htmlFor="eventType" className="mb-1.5 block text-xs">
              {t("eventTypeLabel")}
            </Label>
            <Select
              items={EVENT_TYPE_ITEMS}
              value={searchParams.get("eventType") ?? ANY}
              onValueChange={(v) => updateParam("eventType", v)}
            >
              <SelectTrigger id="eventType" className="w-full">
                <SelectValue placeholder={t("anyType")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ANY}>{t("anyType")}</SelectItem>
                {Object.entries(EVENT_TYPE_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="format" className="mb-1.5 block text-xs">
              {t("formatLabel")}
            </Label>
            <Select
              items={FORMAT_ITEMS}
              value={searchParams.get("format") ?? ANY}
              onValueChange={(v) => updateParam("format", v)}
            >
              <SelectTrigger id="format" className="w-full">
                <SelectValue placeholder={t("anyFormat")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ANY}>{t("anyFormat")}</SelectItem>
                {Object.entries(EVENT_FORMAT_LABELS).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
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
                {LANGUAGE_OPTIONS.map((l) => (
                  <SelectItem key={l} value={l}>
                    {l}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="topic" className="mb-1.5 block text-xs">
              {t("topicLabel")}
            </Label>
            <Select
              items={TOPIC_ITEMS}
              value={searchParams.get("topic") ?? ANY}
              onValueChange={(v) => updateParam("topic", v)}
            >
              <SelectTrigger id="topic" className="w-full">
                <SelectValue placeholder={t("anyTopic")} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ANY}>{t("anyTopic")}</SelectItem>
                {EVENT_TOPICS.map((topic) => (
                  <SelectItem key={topic} value={topic}>
                    {topic}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="from" className="mb-1.5 block text-xs">
              {t("fromLabel")}
            </Label>
            <Input
              id="from"
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              onBlur={handleSubmit}
            />
          </div>

          <div>
            <Label htmlFor="to" className="mb-1.5 block text-xs">
              {t("toLabel")}
            </Label>
            <Input
              id="to"
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              onBlur={handleSubmit}
            />
          </div>
        </div>

        <div className="flex items-center justify-between border-t border-border pt-3">
          <Label htmlFor="includePast" className="text-sm font-normal">
            {t("includePastLabel")}
          </Label>
          <Switch
            id="includePast"
            checked={searchParams.get("includePast") === "true"}
            onCheckedChange={(checked) => toggleParam("includePast", checked)}
          />
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-border pt-3">
          <Label htmlFor="sort" className="text-xs text-muted-foreground">
            {t("sortLabel")}
          </Label>
          <Select
            items={SORT_ITEMS}
            value={searchParams.get("sort") ?? "soonest"}
            onValueChange={(v) => updateParam("sort", v)}
          >
            <SelectTrigger id="sort" className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SORT_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </form>
    </SearchDisclosure>
  );
}
