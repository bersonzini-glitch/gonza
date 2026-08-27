import { ExternalLink } from "lucide-react";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";

import { DeleteSocietyButton } from "@/components/admin/delete-society-button";
import { SocietyForm } from "@/components/admin/society-form";
import { Button } from "@/components/ui/button";
import { updateSocietyAction } from "@/lib/actions/admin";
import { getSocietyForAdmin } from "@/lib/data/admin";
import { localizedPath } from "@/lib/hreflang";
import type { SocietyInput } from "@/lib/validation/society";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

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
    slug: society.slug,
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
        <div className="flex items-center gap-2">
          <Button variant="outline" asChild>
            <a
              href={`${SITE_URL}${localizedPath(`/societies/${society.slug}`, locale)}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <ExternalLink className="size-4" aria-hidden="true" />
              {t("viewPublished")}
            </a>
          </Button>
          <DeleteSocietyButton societyId={society.id} />
        </div>
      </div>
      <SocietyForm
        defaultValues={defaultValues}
        action={updateSocietyAction.bind(null, locale, society.id)}
      />
    </div>
  );
}
