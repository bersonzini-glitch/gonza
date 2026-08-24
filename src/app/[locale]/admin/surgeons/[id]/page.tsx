import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { notFound } from "next/navigation";

import { SurgeonReviewActions } from "@/components/admin/surgeon-review-actions";
import { SurgeonProfileForm } from "@/components/surgeon-profile/surgeon-profile-form";
import { Badge } from "@/components/ui/badge";
import { adminUpdateSurgeonProfileAction } from "@/lib/actions/admin";
import { getSurgeonForAdmin } from "@/lib/data/admin";
import { formatDate, primarySpecialtyLabels } from "@/lib/format";
import type { SurgeonProfileFormValues } from "@/lib/validation/surgeon";

export const metadata: Metadata = { title: "Revisar perfil de cirujano" };
export const dynamic = "force-dynamic";

const STATUS_LABELS: Record<string, string> = {
  submitted: "enviado",
  approved: "aprobado",
  rejected: "rechazado",
  suspended: "suspendido",
  draft: "borrador",
};

export default async function AdminSurgeonDetailPage({
  params,
}: {
  params: Promise<{ id: string; locale: string }>;
}) {
  const { id, locale } = await params;
  const surgeon = await getSurgeonForAdmin(id);
  if (!surgeon) notFound();

  const tSpecialties = await getTranslations("specialties");
  const PRIMARY_SPECIALTY_LABELS = primarySpecialtyLabels(tSpecialties);

  const defaultValues: SurgeonProfileFormValues = {
    fullName: surgeon.full_name,
    slug: surgeon.slug,
    primarySpecialty: surgeon.primary_specialty,
    subspecialties: surgeon.surgeon_specialties.map((s) => s.specialty),
    bio: surgeon.bio ?? "",
    hospitalAffiliations: surgeon.hospital_affiliations ?? [],
    medicalLicenseNumber: surgeon.medical_license_number ?? "",
    medicalLicenseCountry: surgeon.medical_license_country ?? "",
    specialistLicenseNumber: surgeon.specialist_license_number ?? "",
    yearsExperience: surgeon.years_experience ?? undefined,
    consultationFormat: surgeon.consultation_format,
    languages: surgeon.languages as SurgeonProfileFormValues["languages"],
    websiteUrl: surgeon.website_url ?? "",
    instagramUrl: surgeon.instagram_url ?? "",
    linkedinUrl: surgeon.linkedin_url ?? "",
    contactEmail: surgeon.contact_email ?? "",
    contactPhone: surgeon.contact_phone ?? "",
    locations: surgeon.surgeon_locations.map((l) => ({
      country: l.country,
      city: l.city,
      isPrimary: l.is_primary,
    })),
  };

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/admin/surgeons"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← Volver a la cola
        </Link>
        <div className="mt-2 flex flex-wrap items-center gap-3">
          <h2 className="font-heading text-2xl font-semibold text-foreground">
            {surgeon.full_name}
          </h2>
          <Badge>{STATUS_LABELS[surgeon.status]}</Badge>
          {surgeon.is_demo && <Badge variant="outline">Dato de muestra</Badge>}
        </div>
        <p className="mt-1 text-sm text-muted-foreground">
          {PRIMARY_SPECIALTY_LABELS[surgeon.primary_specialty]} · Creado el{" "}
          {formatDate(surgeon.created_at.slice(0, 10), locale)}
        </p>
      </div>

      <div className="surface-flat p-4">
        <SurgeonReviewActions surgeonId={surgeon.id} status={surgeon.status} />
      </div>

      <div className="surface-flat p-6">
        <h3 className="mb-4 font-heading text-lg font-semibold text-foreground">
          Editar perfil
        </h3>
        <SurgeonProfileForm
          defaultValues={defaultValues}
          action={adminUpdateSurgeonProfileAction.bind(null, locale, surgeon.id)}
        />
      </div>
    </div>
  );
}
