"use client";

import { Search } from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";
import { useState, useTransition } from "react";

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
import { EVENT_FORMAT_LABELS, EVENT_TYPE_LABELS } from "@/lib/format";
import { EVENT_TOPICS, LATAM_COUNTRIES } from "@/lib/validation/event";

const SORT_OPTIONS = [
  { value: "soonest", label: "Soonest" },
  { value: "recently_added", label: "Most recently added" },
  { value: "alphabetical", label: "Alphabetical" },
] as const;

const ANY = "__any__";

export function EventFilters() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [q, setQ] = useState(searchParams.get("q") ?? "");
  const [from, setFrom] = useState(searchParams.get("from") ?? "");
  const [to, setTo] = useState(searchParams.get("to") ?? "");

  function updateParam(key: string, value: string | null) {
    const params = new URLSearchParams(searchParams.toString());
    if (value && value !== ANY) params.set(key, value);
    else params.delete(key);
    params.delete("page");
    startTransition(() => router.push(`/events?${params.toString()}`));
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

  return (
    <form
      onSubmit={handleSubmit}
      aria-label="Filter congresses"
      className="space-y-4 rounded-xl border border-border bg-card p-4 sm:p-5"
    >
      <div className="flex flex-col gap-2 sm:flex-row">
        <div className="flex-1">
          <Label htmlFor="q" className="sr-only">
            Search
          </Label>
          <div className="relative">
            <Search
              className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <Input
              id="q"
              type="search"
              placeholder="Event, organizer, city…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>
        <Button type="submit" disabled={isPending}>
          Apply
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        <div>
          <Label htmlFor="country" className="mb-1.5 block text-xs">
            Country
          </Label>
          <Select
            value={searchParams.get("country") ?? ANY}
            onValueChange={(v) => updateParam("country", v)}
          >
            <SelectTrigger id="country" className="w-full">
              <SelectValue placeholder="Any country" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ANY}>Any country</SelectItem>
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
            Event type
          </Label>
          <Select
            value={searchParams.get("eventType") ?? ANY}
            onValueChange={(v) => updateParam("eventType", v)}
          >
            <SelectTrigger id="eventType" className="w-full">
              <SelectValue placeholder="Any type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ANY}>Any type</SelectItem>
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
            Format
          </Label>
          <Select
            value={searchParams.get("format") ?? ANY}
            onValueChange={(v) => updateParam("format", v)}
          >
            <SelectTrigger id="format" className="w-full">
              <SelectValue placeholder="Any format" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ANY}>Any format</SelectItem>
              {Object.entries(EVENT_FORMAT_LABELS).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="topic" className="mb-1.5 block text-xs">
            Topic
          </Label>
          <Select
            value={searchParams.get("topic") ?? ANY}
            onValueChange={(v) => updateParam("topic", v)}
          >
            <SelectTrigger id="topic" className="w-full">
              <SelectValue placeholder="Any topic" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ANY}>Any topic</SelectItem>
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
            From
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
            To
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

      <div className="flex items-center justify-between gap-3 border-t border-border pt-3">
        <Label htmlFor="sort" className="text-xs text-muted-foreground">
          Sort by
        </Label>
        <Select
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
  );
}
