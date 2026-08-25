"use client";

import { useTranslations } from "next-intl";
import { useState } from "react";

export function ExpandableDescription({ text }: { text: string }) {
  const [expanded, setExpanded] = useState(false);
  const t = useTranslations("societyCard");

  return (
    <div>
      <p
        className={`whitespace-pre-line text-sm text-muted-foreground ${expanded ? "" : "line-clamp-4"}`}
      >
        {text}
      </p>
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="mt-1 text-sm font-medium text-primary hover:underline"
      >
        {expanded ? t("readLess") : t("readMore")}
      </button>
    </div>
  );
}
