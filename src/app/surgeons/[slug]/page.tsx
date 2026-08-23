import { BadgeCheck, Building2, Globe, Languages, Mail, MapPin, Phone, Video } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { FadeIn } from "@/components/shared/fade-in";
import { ShareButton } from "@/components/shared/share-button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { formatDate, PRIMARY_SPECIALTY_LABELS } from "@/lib/format";
import { getSurgeonBySlug } from "@/lib/data/surgeons";
import { surgeonPhotoUrl } from "@/lib/supabase/storage";

export const revalidate = 120;

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase();
}

export async function generateMetadata({
  params,
}: PageProps<"/surgeons/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const surgeon = await getSurgeonBySlug(slug);
  if (!surgeon || surgeon.status !== "approved") return {};

  const description = `${surgeon.professional_title ?? PRIMARY_SPECIALTY_LABELS[surgeon.primary_specialty]}, especialista en ${PRIMARY_SPECIALTY_LABELS[surgeon.primary_specialty].toLowerCase()}.`;

  return {
    title: surgeon.full_name,
    description,
    alternates: { canonical: `/surgeons/${surgeon.slug}` },
    openGraph: { title: surgeon.full_name, description, type: "profile" },
  };
}

export default async function SurgeonProfilePage({ params }: PageProps<"/surgeons/[slug]">) {
  const { slug } = await params;
  const surgeon = await getSurgeonBySlug(slug);

  if (!surgeon || surgeon.status !== "approved") notFound();

  const photoUrl = surgeonPhotoUrl(surgeon.id, Boolean(surgeon.photo_path));
  const primaryLocation =
    surgeon.surgeon_locations.find((l) => l.is_primary) ?? surgeon.surgeon_locations[0];

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Physician",
    name: surgeon.full_name,
    jobTitle: surgeon.professional_title ?? undefined,
    description: surgeon.bio ?? undefined,
    medicalSpecialty: PRIMARY_SPECIALTY_LABELS[surgeon.primary_specialty],
    url: `${SITE_URL}/surgeons/${surgeon.slug}`,
    address: primaryLocation
      ? {
          "@type": "PostalAddress",
          addressLocality: primaryLocation.city,
          addressCountry: primaryLocation.country,
        }
      : undefined,
    inLanguage: "es",
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <nav aria-label="Ruta de navegación" className="text-sm text-muted-foreground">
        <Link href="/surgeons" className="hover:text-foreground">
          Directorio de cirujanos
        </Link>
        <span className="mx-1.5">/</span>
        <span className="text-foreground">{surgeon.full_name}</span>
      </nav>

      <FadeIn>
        <div className="mt-6 flex flex-col gap-5 sm:flex-row sm:items-start">
          <Avatar className="size-24 shrink-0">
            <AvatarImage src={photoUrl ?? undefined} alt="" />
            <AvatarFallback className="text-xl">{initials(surgeon.full_name)}</AvatarFallback>
          </Avatar>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="font-heading text-2xl font-semibold text-foreground sm:text-3xl">
                {surgeon.full_name}
              </h1>
              {!surgeon.is_demo && (
                <BadgeCheck className="size-5 text-primary" aria-label="Perfil verificado" />
              )}
            </div>
            {surgeon.professional_title && (
              <p className="mt-1 text-muted-foreground">{surgeon.professional_title}</p>
            )}

            <div className="mt-3 flex flex-wrap gap-1.5">
              <Badge variant="secondary">
                {PRIMARY_SPECIALTY_LABELS[surgeon.primary_specialty]}
              </Badge>
              {surgeon.is_demo && <Badge variant="outline">Perfil de muestra</Badge>}
              {surgeon.approved_at && (
                <Badge variant="outline">
                  Verificado el {formatDate(surgeon.approved_at.slice(0, 10))}
                </Badge>
              )}
            </div>

            <div className="mt-4">
              <ShareButton title={surgeon.full_name} url={`${SITE_URL}/surgeons/${surgeon.slug}`} />
            </div>
          </div>
        </div>

        {surgeon.is_demo && (
          <div className="mt-6 rounded-lg border border-warning/40 bg-warning/10 p-4 text-sm text-warning-foreground">
            Este es un <strong>perfil de muestra</strong> claramente identificado, usado para
            demostrar el directorio mientras se incorporan perfiles reales y verificados de
            cirujanos. No representa a una persona real.
          </div>
        )}

        {surgeon.bio && (
          <div className="prose prose-neutral dark:prose-invert mt-8 max-w-none">
            <h2 className="font-heading text-xl font-semibold text-foreground">Biografía</h2>
            <p className="whitespace-pre-line text-muted-foreground">{surgeon.bio}</p>
          </div>
        )}

        {surgeon.surgeon_specialties.length > 0 && (
          <div className="mt-8">
            <h2 className="text-sm font-semibold text-foreground">
              Subespecialidades y procedimientos
            </h2>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {surgeon.surgeon_specialties.map((s) => (
                <Badge key={s.id} variant="secondary">
                  {s.specialty}
                </Badge>
              ))}
            </div>
          </div>
        )}

        <div className="mt-8 grid grid-cols-1 gap-4 rounded-xl border border-border bg-card p-5 sm:grid-cols-2">
          {surgeon.surgeon_locations.map((location) => (
            <div key={location.id} className="flex gap-2.5">
              <MapPin className="mt-0.5 size-4.5 shrink-0 text-primary" aria-hidden="true" />
              <div>
                <p className="text-sm text-foreground">
                  {location.city}, {location.country}
                </p>
              </div>
            </div>
          ))}

          {surgeon.hospital_affiliation && (
            <div className="flex gap-2.5">
              <Building2 className="mt-0.5 size-4.5 shrink-0 text-primary" aria-hidden="true" />
              <div>
                <p className="text-xs font-medium text-muted-foreground">Hospital / clínica</p>
                <p className="text-sm text-foreground">{surgeon.hospital_affiliation}</p>
              </div>
            </div>
          )}

          {surgeon.medical_license_number && (
            <div className="flex gap-2.5">
              <BadgeCheck className="mt-0.5 size-4.5 shrink-0 text-primary" aria-hidden="true" />
              <div>
                <p className="text-xs font-medium text-muted-foreground">
                  Matrícula profesional
                </p>
                <p className="text-sm text-foreground">
                  {surgeon.medical_license_number}
                  {surgeon.medical_license_country ? ` (${surgeon.medical_license_country})` : ""}
                </p>
              </div>
            </div>
          )}

          {surgeon.languages.length > 0 && (
            <div className="flex gap-2.5">
              <Languages className="mt-0.5 size-4.5 shrink-0 text-primary" aria-hidden="true" />
              <div>
                <p className="text-xs font-medium text-muted-foreground">Idiomas</p>
                <p className="text-sm text-foreground">{surgeon.languages.join(", ")}</p>
              </div>
            </div>
          )}

          <div className="flex gap-2.5">
            <Video className="mt-0.5 size-4.5 shrink-0 text-primary" aria-hidden="true" />
            <div>
              <p className="text-xs font-medium text-muted-foreground">Modalidad de consulta</p>
              <p className="text-sm text-foreground">
                {[
                  surgeon.in_person_available && "Presencial",
                  surgeon.telemedicine_available && "Telemedicina",
                ]
                  .filter(Boolean)
                  .join(" · ") || "No especificado"}
              </p>
            </div>
          </div>
        </div>

        {(surgeon.website_url || surgeon.contact_email || surgeon.contact_phone) && (
          <div className="mt-6 flex flex-wrap gap-4 text-sm">
            {surgeon.website_url && (
              <a
                href={surgeon.website_url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-primary hover:underline"
              >
                <Globe className="size-4" aria-hidden="true" />
                Sitio web profesional
              </a>
            )}
            {surgeon.contact_email && (
              <a
                href={`mailto:${surgeon.contact_email}`}
                className="flex items-center gap-1.5 text-primary hover:underline"
              >
                <Mail className="size-4" aria-hidden="true" />
                {surgeon.contact_email}
              </a>
            )}
            {surgeon.contact_phone && (
              <span className="flex items-center gap-1.5 text-muted-foreground">
                <Phone className="size-4" aria-hidden="true" />
                {surgeon.contact_phone}
              </span>
            )}
          </div>
        )}

        <p className="mt-10 border-t border-border pt-6 text-xs text-muted-foreground">
          Este perfil es solo informativo y no constituye consejo médico ni un aval. Siempre
          verificá las credenciales directamente con el cirujano o su institución.{" "}
          <Link href="/privacy" className="underline">
            Leé nuestro aviso legal completo
          </Link>
          .
        </p>
      </FadeIn>
    </div>
  );
}
