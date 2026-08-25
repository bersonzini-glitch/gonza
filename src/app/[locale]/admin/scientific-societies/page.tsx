import { Plus } from "lucide-react";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { listSocietiesForAdmin } from "@/lib/data/admin";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/admin/scientific-societies">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "adminSocietiesPage" });
  return { title: t("metaTitle") };
}

export const dynamic = "force-dynamic";

export default async function AdminSocietiesPage({
  params,
}: PageProps<"/[locale]/admin/scientific-societies">) {
  const { locale } = await params;
  const societies = await listSocietiesForAdmin();
  const t = await getTranslations({ locale, namespace: "adminSocietiesPage" });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="font-heading text-2xl font-semibold text-foreground">{t("heading")}</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {t("countLabel", { count: societies.length })}
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/scientific-societies/new">
            <Plus className="size-4" /> {t("newSociety")}
          </Link>
        </Button>
      </div>

      <div className="surface-flat overflow-x-auto">
        <table className="w-full min-w-[640px] text-sm">
          <thead className="border-b border-border bg-secondary/40 text-left text-xs font-medium tracking-wide text-muted-foreground uppercase">
            <tr>
              <th className="px-4 py-3">{t("nameHeader")}</th>
              <th className="px-4 py-3">{t("countryHeader")}</th>
              <th className="px-4 py-3">{t("specialtiesHeader")}</th>
            </tr>
          </thead>
          <tbody>
            {societies.map((society) => (
              <tr
                key={society.id}
                className="border-b border-border last:border-0 hover:bg-secondary/30"
              >
                <td className="px-4 py-3">
                  <Link
                    href={`/admin/scientific-societies/${society.id}/edit`}
                    className="font-medium text-primary hover:underline"
                  >
                    {society.name}
                  </Link>
                </td>
                <td className="px-4 py-3 text-muted-foreground">{society.country}</td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-1">
                    {society.specialties.map((s) => (
                      <Badge key={s} variant="outline">
                        {s}
                      </Badge>
                    ))}
                  </div>
                </td>
              </tr>
            ))}
            {societies.length === 0 && (
              <tr>
                <td colSpan={3} className="px-4 py-10 text-center text-muted-foreground">
                  {t("emptyState")}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
