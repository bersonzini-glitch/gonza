"use client";

import { Search, X } from "lucide-react";
import { useState, type ReactNode } from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * Collapsed-by-default search form, but only below `lg` — the same
 * breakpoint where the header switches to its mobile nav. On `lg`+ the
 * form always renders expanded regardless of `open`, so this stays a pure
 * CSS override (no viewport JS/hydration mismatch): both the collapsed
 * button and the form are always in the DOM, and `lg:hidden` /
 * `hidden lg:block` decide which one paints at a given breakpoint.
 */
export function SearchDisclosure({
  label,
  hideLabel,
  startOpen,
  children,
}: {
  label: string;
  hideLabel: string;
  startOpen: boolean;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(startOpen);

  return (
    <div>
      <div className={cn("lg:hidden", open && "hidden")}>
        <Button type="button" variant="outline" onClick={() => setOpen(true)} className="gap-2">
          <Search className="size-4" aria-hidden="true" />
          {label}
        </Button>
      </div>
      <div className={cn("space-y-2", !open && "hidden lg:block")}>
        <div className="flex justify-end lg:hidden">
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="inline-flex items-center gap-1 text-xs text-muted-foreground transition-colors hover:text-foreground"
          >
            <X className="size-3.5" aria-hidden="true" />
            {hideLabel}
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
