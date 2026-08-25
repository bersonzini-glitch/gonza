import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";

import { DeleteSocietyButton } from "@/components/admin/delete-society-button";
import { SocietyForm } from "@/components/admin/society-form";
import { updateSocietyAction } from "@/lib/actions/admin";
import { getSocietyForAdmin } from "@/lib/data/admin";
import type { SocietyInput } from "@/lib/validation/society";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/admin/scientific-societies/[id]/edit">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "societyForm" });
  return { title: t("metaTitleEdit") };
}

export const dynamic = "force-dynamic";

export default async function EditSocietyPage({
  params,
}: PageProps<"/[locale]/admin/scientific-societies/[id]/edit">) {
  const { id, locale } = await params;
  const society = await getSocietyForAdmin(id);
  if (!society) notFound();
  const t = await getTranslations({ locale, namespace: "societyForm" });

  const defaultValues: SocietyInput = {
    name: society.name,
    description: society.description,
    country: society.country,
    specialties: society.specialties,
    websiteUrl: society.website_url,
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h2 className="font-heading text-2xl font-semibold text-foreground">
          {t("headingEdit")}
        </h2>
        <DeleteSocietyButton societyId={society.id} />
      </div>
      <SocietyForm
        defaultValues={defaultValues}
        action={updateSocietyAction.bind(null, locale, society.id)}
      />
    </div>
  );
}
