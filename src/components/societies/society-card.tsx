import { Globe2 } from "lucide-react";
import { Link } from "@/i18n/navigation";

import { Badge } from "@/components/ui/badge";
import type { ScientificSocietyRow } from "@/lib/data/societies";

export function SocietyCard({ society }: { society: ScientificSocietyRow }) {
  return (
    <Link
      href={`/societies/${society.slug}`}
      className="group flex h-full flex-col gap-3 rounded-xl border border-border bg-card p-5 transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md focus-visible:-translate-y-0.5 focus-visible:border-primary/40 focus-visible:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <div>
        <h3 className="font-heading text-base font-semibold text-foreground group-hover:text-primary">
          {society.name}
        </h3>
        <p className="mt-1 flex items-center gap-1.5 text-sm text-muted-foreground">
          <Globe2 className="size-3.5 shrink-0" aria-hidden="true" />
          {society.country}
        </p>
      </div>

      <p className="line-clamp-4 whitespace-pre-line text-sm text-muted-foreground">
        {society.description}
      </p>

      <div className="mt-auto flex flex-wrap gap-1.5">
        {society.specialties.map((s) => (
          <Badge key={s} variant="secondary">
            {s}
          </Badge>
        ))}
      </div>
    </Link>
  );
}
