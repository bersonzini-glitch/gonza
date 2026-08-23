"use client";

import { Check, Share2 } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";

export function ShareButton({ title, url }: { title: string; url: string }) {
  const [copied, setCopied] = useState(false);

  async function handleShare() {
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title, url });
        return;
      } catch {
        // User cancelled or share failed — fall through to clipboard.
      }
    }

    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API unavailable — no-op, user can copy the URL manually.
    }
  }

  return (
    <Button type="button" variant="outline" onClick={handleShare} className="gap-2">
      {copied ? (
        <>
          <Check className="size-4" aria-hidden="true" />
          Enlace copiado
        </>
      ) : (
        <>
          <Share2 className="size-4" aria-hidden="true" />
          Compartir
        </>
      )}
    </Button>
  );
}
