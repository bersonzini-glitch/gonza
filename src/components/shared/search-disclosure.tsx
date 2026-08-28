"use client";

import { Search, X } from "lucide-react";
import { useState, type ReactNode } from "react";

import { Button } from "@/components/ui/button";

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

  if (!open) {
    return (
      <Button type="button" variant="outline" onClick={() => setOpen(true)} className="gap-2">
        <Search className="size-4" aria-hidden="true" />
        {label}
      </Button>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex justify-end">
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
  );
}
