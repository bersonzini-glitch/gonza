import { CheckCircle2, Clock, Eye, FileEdit, ShieldAlert, XCircle } from "lucide-react";
import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Link } from "@/i18n/navigation";

import { PhotoUpload } from "@/components/surgeon-profile/photo-upload";
import { SubmitButton } from "@/components/surgeon-profile/submit-button";
import { SurgeonProfileForm } from "@/components/surgeon-profile/surgeon-profile-form";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { requireUser } from "@/lib/auth/session";
import { getOwnSurgeonProfile } from "@/lib/data/surgeons";
import { saveSurgeonProfileAction } from "@/lib/actions/surgeon";
import type { SurgeonProfileFormValues } from "@/lib/validation/surgeon";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/dashboard">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "dashboard" });
  return { title: t("title") };
}

export const dynamic = "force-dynamic";

export default async function DashboardPage({ params }: PageProps<"/[locale]/dashboard">) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("dashboard");

  const STATUS_META = {
    draft: {
      icon: FileEdit,
      label: t("statusDraftLabel"),
      description: t("statusDraftDescription"),
    },
    submitted: {
      icon: Clock,
      label: t("statusSubmittedLabel"),
      description: t("statusSubmittedDescription"),
    },
    approved: {
      icon: CheckCircle2,
      label: t("statusApprovedLabel"),
      description: t("statusApprovedDescription"),
    },
    rejected: {
      icon: XCircle,
      label: t("statusRejectedLabel"),
      description: t("statusRejectedDescription"),
    },
    suspended: {
      icon: ShieldAlert,
      label: t("statusSuspendedLabel"),
      description: t("statusSuspendedDescription"),
    },
  } as const;

  const profile = await requireUser("/dashboard");
  const surgeon = await getOwnSurgeonProfile(profile.id);

  const defaultValues: SurgeonProfileFormValues = surgeon
    ? {
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
        notifyNewEvents: profile.notify_new_events,
        notifySuggestedInvitations: profile.notify_suggested_invitations,
      }
    : {
        fullName: profile.full_name ?? "",
        primarySpecialty: "orthopedic_spine_surgeon",
        subspecialties: [],
        bio: "",
        hospitalAffiliations: [],
        medicalLicenseNumber: "",
        medicalLicenseCountry: "",
        specialistLicenseNumber: "",
        yearsExperience: undefined,
        consultationFormat: "in_person",
        languages: [],
        websiteUrl: "",
        instagramUrl: "",
        linkedinUrl: "",
        contactEmail: "",
        contactPhone: "",
        locations: [{ country: "", city: "", isPrimary: true }],
        notifyNewEvents: profile.notify_new_events,
        notifySuggestedInvitations: profile.notify_suggested_invitations,
      };

  const statusMeta = surgeon ? STATUS_META[surgeon.status] : null;

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="font-heading text-3xl font-semibold text-foreground">{t("title")}</h1>
      <p className="mt-2 text-muted-foreground">
        {t("subtitle")}{" "}
        <Link href="/privacy" className="text-primary hover:underline">
          {t("readDisclaimer")}
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
                {t("reviewerNote", { reason: surgeon.rejection_reason })}
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
          {t("viewPublicProfile")}
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
          {t("editHeading")}
        </h2>
        <SurgeonProfileForm
          defaultValues={defaultValues}
          action={saveSurgeonProfileAction.bind(null, locale)}
          awaitingFirstSubmission={!surgeon || surgeon.status === "draft" || surgeon.status === "rejected"}
        />
        {surgeon && (surgeon.status === "draft" || surgeon.status === "rejected") && (
          <div className="mt-6 border-t border-border pt-6">
            <p className="mb-3 text-sm text-muted-foreground">{t("readyToSubmit")}</p>
            <SubmitButton />
          </div>
        )}
      </div>
    </div>
  );
}
