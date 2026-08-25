import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { SocietyForm } from "@/components/admin/society-form";
import { createSocietyAction } from "@/lib/actions/admin";
import type { SocietyInput } from "@/lib/validation/society";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/admin/scientific-societies/new">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "societyForm" });
  return { title: t("metaTitleNew") };
}

const defaultValues: SocietyInput = {
  name: "",
  description: "",
  country: "",
  specialties: [],
  websiteUrl: "",
};

export default async function NewSocietyPage({
  params,
}: PageProps<"/[locale]/admin/scientific-societies/new">) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "societyForm" });

  return (
    <div>
      <h2 className="mb-6 font-heading text-2xl font-semibold text-foreground">
        {t("headingNew")}
      </h2>
      <SocietyForm defaultValues={defaultValues} action={createSocietyAction.bind(null, locale)} />
    </div>
  );
}
