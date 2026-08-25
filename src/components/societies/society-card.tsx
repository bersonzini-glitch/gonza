import { ExternalLink, Globe2 } from "lucide-react";
import { getTranslations } from "next-intl/server";

import { ExpandableDescription } from "@/components/societies/expandable-description";
import { Badge } from "@/components/ui/badge";
import type { ScientificSocietyRow } from "@/lib/data/societies";

export async function SocietyCard({ society }: { society: ScientificSocietyRow }) {
  const t = await getTranslations("societyCard");
  const hostname = (() => {
    try {
      return new URL(society.website_url).hostname.replace(/^www\./, "");
    } catch {
      return society.website_url;
    }
  })();

  return (
    <div className="flex h-full flex-col gap-3 rounded-xl border border-border bg-card p-5">
      <div>
        <h3 className="font-heading text-base font-semibold text-foreground">{society.name}</h3>
        <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
          <Globe2 className="size-3.5 shrink-0" aria-hidden="true" />
          {society.country}
        </p>
      </div>

      <ExpandableDescription text={society.description} />

      <div className="flex flex-wrap gap-1.5">
        {society.specialties.map((s) => (
          <Badge key={s} variant="secondary">
            {s}
          </Badge>
        ))}
      </div>

      <a
        href={society.website_url}
        target="_blank"
        rel="noopener noreferrer"
        className="mt-auto flex items-center gap-1.5 text-sm font-medium text-primary hover:underline"
      >
        <ExternalLink className="size-3.5 shrink-0" aria-hidden="true" />
        {t("visitSite", { hostname })}
      </a>
    </div>
  );
}
