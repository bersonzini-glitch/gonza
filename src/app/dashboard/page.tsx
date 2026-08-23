import { CheckCircle2, Clock, Eye, FileEdit, ShieldAlert, XCircle } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { PhotoUpload } from "@/components/surgeon-profile/photo-upload";
import { SubmitButton } from "@/components/surgeon-profile/submit-button";
import { SurgeonProfileForm } from "@/components/surgeon-profile/surgeon-profile-form";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { requireUser } from "@/lib/auth/session";
import { getOwnSurgeonProfile } from "@/lib/data/surgeons";
import type { SurgeonProfileFormValues } from "@/lib/validation/surgeon";

export const metadata: Metadata = { title: "Mi perfil de cirujano" };
export const dynamic = "force-dynamic";

const STATUS_META = {
  draft: {
    icon: FileEdit,
    label: "Borrador",
    description: "Este perfil solo es visible para vos. Completalo y enviálo a revisión.",
  },
  submitted: {
    icon: Clock,
    label: "En revisión",
    description:
      "Un administrador está revisando tu perfil. Te avisaremos apenas haya una decisión.",
  },
  approved: {
    icon: CheckCircle2,
    label: "Aprobado y público",
    description: "Tu perfil ya está publicado en el directorio.",
  },
  rejected: {
    icon: XCircle,
    label: "Se solicitaron cambios",
    description: "Un administrador pidió cambios. Editá tu perfil abajo y volvé a enviarlo.",
  },
  suspended: {
    icon: ShieldAlert,
    label: "Suspendido",
    description: "Tu perfil fue suspendido y no es visible públicamente. Contactá a un administrador.",
  },
} as const;

export default async function DashboardPage() {
  const profile = await requireUser("/dashboard");
  const surgeon = await getOwnSurgeonProfile(profile.id);

  const defaultValues: SurgeonProfileFormValues = surgeon
    ? {
        fullName: surgeon.full_name,
        slug: surgeon.slug,
        professionalTitle: surgeon.professional_title ?? "",
        primarySpecialty: surgeon.primary_specialty,
        subspecialties: surgeon.surgeon_specialties.map((s) => s.specialty),
        bio: surgeon.bio ?? "",
        hospitalAffiliation: surgeon.hospital_affiliation ?? "",
        medicalLicenseNumber: surgeon.medical_license_number ?? "",
        medicalLicenseCountry: surgeon.medical_license_country ?? "",
        yearsExperience: surgeon.years_experience ?? undefined,
        consultationFormat: surgeon.consultation_format,
        languages: surgeon.languages as SurgeonProfileFormValues["languages"],
        websiteUrl: surgeon.website_url ?? "",
        contactEmail: surgeon.contact_email ?? "",
        contactPhone: surgeon.contact_phone ?? "",
        locations: surgeon.surgeon_locations.map((l) => ({
          country: l.country,
          city: l.city,
          isPrimary: l.is_primary,
        })),
      }
    : {
        fullName: profile.full_name ?? "",
        professionalTitle: "",
        primarySpecialty: "orthopedic_spine_surgeon",
        subspecialties: [],
        bio: "",
        hospitalAffiliation: "",
        medicalLicenseNumber: "",
        medicalLicenseCountry: "",
        yearsExperience: undefined,
        consultationFormat: "in_person",
        languages: [],
        websiteUrl: "",
        contactEmail: "",
        contactPhone: "",
        locations: [{ country: "", city: "", isPrimary: true }],
      };

  const statusMeta = surgeon ? STATUS_META[surgeon.status] : null;

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="font-heading text-3xl font-semibold text-foreground">
        Mi perfil de cirujano
      </h1>
      <p className="mt-2 text-muted-foreground">
        Administrá la información que se muestra en el directorio público. Nada es visible
        públicamente hasta que un administrador lo apruebe.{" "}
        <Link href="/privacy" className="text-primary hover:underline">
          Leé nuestro aviso legal
        </Link>
        .
      </p>

      {statusMeta && (
        <Alert className="mt-6">
          <statusMeta.icon className="size-4" />
          <AlertTitle>{statusMeta.label}</AlertTitle>
          <AlertDescription>
            {statusMeta.description}
            {surgeon?.status === "rejected" && surgeon.rejection_reason && (
              <p className="mt-1 font-medium text-foreground">
                Nota del revisor: {surgeon.rejection_reason}
              </p>
            )}
          </AlertDescription>
        </Alert>
      )}

      {surgeon?.status === "approved" && (
        <Link
          href={`/surgeons/${surgeon.slug}`}
          className="mt-3 inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
        >
          <Eye className="size-4" />
          Ver tu perfil público
        </Link>
      )}

      {surgeon && (
        <div className="surface-flat mt-8 p-6">
          <PhotoUpload
            surgeonId={surgeon.id}
            hasPhoto={Boolean(surgeon.photo_path)}
            fullName={surgeon.full_name}
          />
        </div>
      )}

      <div className="surface-flat mt-8 p-6">
        <h2 className="mb-5 font-heading text-lg font-semibold text-foreground">
          Editar información del perfil
        </h2>
        <SurgeonProfileForm defaultValues={defaultValues} />
        {surgeon && (surgeon.status === "draft" || surgeon.status === "rejected") && (
          <div className="mt-6 border-t border-border pt-6">
            <p className="mb-3 text-sm text-muted-foreground">
              ¿Listo para la revisión? Primero guardá tus cambios de arriba y después enviá.
            </p>
            <SubmitButton />
          </div>
        )}
      </div>
    </div>
  );
}
