import { BadgeCheck, MapPin, Video } from "lucide-react";
import { Link } from "@/i18n/navigation";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { PRIMARY_SPECIALTY_LABELS } from "@/lib/format";
import { surgeonPhotoUrl } from "@/lib/supabase/storage";
import type { SurgeonWithRelations } from "@/lib/data/surgeons";

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase();
}

export function SurgeonCard({ surgeon }: { surgeon: SurgeonWithRelations }) {
  const primaryLocation =
    surgeon.surgeon_locations.find((l) => l.is_primary) ?? surgeon.surgeon_locations[0];
  const photoUrl = surgeonPhotoUrl(surgeon.id, Boolean(surgeon.photo_path));

  return (
    <Link
      href={`/surgeons/${surgeon.slug}`}
      className="group flex h-full flex-col gap-3 rounded-xl border border-border bg-card p-5 transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md focus-visible:-translate-y-0.5 focus-visible:border-primary/40 focus-visible:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
    >
      <div className="flex items-center gap-3">
        <Avatar className="size-12">
          <AvatarImage src={photoUrl ?? undefined} alt="" />
          <AvatarFallback>{initials(surgeon.full_name)}</AvatarFallback>
        </Avatar>
        <div className="min-w-0">
          <h3 className="truncate font-heading text-base font-semibold text-foreground group-hover:text-primary">
            {surgeon.full_name}
          </h3>
          <p className="truncate text-sm text-muted-foreground">
            {PRIMARY_SPECIALTY_LABELS[surgeon.primary_specialty]}
          </p>
        </div>
        {!surgeon.is_demo && (
          <BadgeCheck
            className="ml-auto size-5 shrink-0 text-primary"
            aria-label="Perfil verificado"
          />
        )}
      </div>

      <div className="flex flex-wrap gap-1.5">
        <Badge variant="secondary">{PRIMARY_SPECIALTY_LABELS[surgeon.primary_specialty]}</Badge>
        {surgeon.is_demo && <Badge variant="outline">Perfil de muestra</Badge>}
      </div>

      <div className="mt-auto space-y-1.5 text-sm text-muted-foreground">
        {primaryLocation && (
          <p className="flex items-center gap-1.5">
            <MapPin className="size-3.5 shrink-0" aria-hidden="true" />
            {primaryLocation.city}, {primaryLocation.country}
          </p>
        )}
        {surgeon.telemedicine_available && (
          <p className="flex items-center gap-1.5">
            <Video className="size-3.5 shrink-0" aria-hidden="true" />
            Telemedicina disponible
          </p>
        )}
      </div>
    </Link>
  );
}
