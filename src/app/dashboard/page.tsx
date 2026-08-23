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

export const metadata: Metadata = { title: "My surgeon profile" };
export const dynamic = "force-dynamic";

const STATUS_META = {
  draft: {
    icon: FileEdit,
    label: "Draft",
    description: "This profile is only visible to you. Fill it out and submit it for review.",
  },
  submitted: {
    icon: Clock,
    label: "Under review",
    description:
      "An administrator is reviewing your profile. You'll be notified once it's decided.",
  },
  approved: {
    icon: CheckCircle2,
    label: "Approved & public",
    description: "Your profile is live in the directory.",
  },
  rejected: {
    icon: XCircle,
    label: "Changes requested",
    description: "An administrator requested changes. Edit your profile below and resubmit.",
  },
  suspended: {
    icon: ShieldAlert,
    label: "Suspended",
    description:
      "Your profile has been suspended and is not publicly visible. Contact an administrator.",
  },
} as const;

export default async function DashboardPage() {
  const profile = await requireUser("/dashboard");
  const surgeon = await getOwnSurgeonProfile(profile.id);

  const defaultValues: SurgeonProfileFormValues = surgeon
    ? {
        fullName: surgeon.full_name,
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
  const canEdit = !surgeon || surgeon.status === "draft" || surgeon.status === "rejected";

  return (
    <div className="mx-auto max-w-3xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="font-heading text-3xl font-semibold text-foreground">My surgeon profile</h1>
      <p className="mt-2 text-muted-foreground">
        Manage the information shown in the public directory. Nothing is visible to the public until
        an administrator approves it.{" "}
        <Link href="/privacy" className="text-primary hover:underline">
          Read our disclaimer
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
                Reviewer note: {surgeon.rejection_reason}
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
          View your public profile
        </Link>
      )}

      {surgeon && (
        <div className="mt-8">
          <PhotoUpload
            surgeonId={surgeon.id}
            hasPhoto={Boolean(surgeon.photo_path)}
            fullName={surgeon.full_name}
          />
        </div>
      )}

      <div className="mt-8">
        {canEdit ? (
          <>
            <SurgeonProfileForm defaultValues={defaultValues} />
            {surgeon && (
              <div className="mt-6 border-t border-border pt-6">
                <p className="mb-3 text-sm text-muted-foreground">
                  Ready for review? Save your changes above first, then submit.
                </p>
                <SubmitButton />
              </div>
            )}
          </>
        ) : (
          <p className="rounded-lg border border-dashed border-border p-6 text-sm text-muted-foreground">
            Your profile can&rsquo;t be edited while it is {surgeon?.status}. Contact an
            administrator if you need to make changes.
          </p>
        )}
      </div>
    </div>
  );
}
