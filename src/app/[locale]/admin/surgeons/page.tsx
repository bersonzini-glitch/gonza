import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";

import { DeleteUnstartedUserButton } from "@/components/admin/delete-unstarted-user-button";
import { Badge } from "@/components/ui/badge";
import { primarySpecialtyLabels } from "@/lib/format";
import { listSurgeonsForAdmin, listUnstartedUsersForAdmin } from "@/lib/data/admin";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/admin/surgeons">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "adminSurgeonsPage" });
  return { title: t("metaTitle") };
}

const STATUS_OPTIONS = ["submitted", "approved", "rejected", "suspended", "draft"] as const;
const STATUS_VARIANT: Record<string, "default" | "secondary" | "outline" | "destructive"> = {
  submitted: "default",
  approved: "secondary",
  rejected: "destructive",
  suspended: "destructive",
  draft: "outline",
};

export default async function AdminSurgeonsPage({
  params,
  searchParams,
}: PageProps<"/[locale]/admin/surgeons">) {
  const { locale } = await params;
  const rawParams = await searchParams;
  const status = typeof rawParams.status === "string" ? rawParams.status : undefined;
  const country = typeof rawParams.country === "string" ? rawParams.country : undefined;
  const specialty = typeof rawParams.specialty === "string" ? rawParams.specialty : undefined;
  const q = typeof rawParams.q === "string" ? rawParams.q : undefined;

  const [surgeons, unstartedUsers] = await Promise.all([
    listSurgeonsForAdmin({
      status: status as never,
      country,
      specialty: specialty as never,
      q,
    }),
    listUnstartedUsersForAdmin(),
  ]);

  const [t, tStatus, tSpecialties] = await Promise.all([
    getTranslations({ locale, namespace: "adminSurgeonsPage" }),
    getTranslations({ locale, namespace: "adminSurgeonStatus" }),
    getTranslations({ locale, namespace: "specialties" }),
  ]);
  const PRIMARY_SPECIALTY_LABELS = primarySpecialtyLabels(tSpecialties);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-heading text-2xl font-semibold text-foreground">{t("heading")}</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {t("subtitle", { count: surgeons.length })}
        </p>
      </div>

      {unstartedUsers.length > 0 && (
        <div className="surface-flat overflow-x-auto">
          <div className="border-b border-border px-4 py-3">
            <h3 className="text-sm font-semibold text-foreground">
              {t("unstartedHeading", { count: unstartedUsers.length })}
            </h3>
            <p className="mt-0.5 text-xs text-muted-foreground">{t("unstartedSubtitle")}</p>
          </div>
          <table className="w-full min-w-[640px] text-sm">
            <thead className="border-b border-border bg-secondary/40 text-left text-xs font-medium tracking-wide text-muted-foreground uppercase">
              <tr>
                <th className="px-4 py-3">{t("unstartedUserHeader")}</th>
                <th className="px-4 py-3">{t("unstartedEmailHeader")}</th>
                <th className="px-4 py-3">{t("unstartedRegisteredHeader")}</th>
                <th className="px-4 py-3">{t("unstartedProgressHeader")}</th>
                <th className="px-4 py-3">
                  <span className="sr-only">{t("unstartedActionsHeader")}</span>
                </th>
              </tr>
            </thead>
            <tbody>
              {unstartedUsers.map((u) => (
                <tr key={u.id} className="border-b border-border last:border-0 hover:bg-secondary/30">
                  <td className="px-4 py-3">
                    <span className="font-medium text-foreground">
                      {u.full_name ?? u.username}
                    </span>
                    <span className="ml-1.5 text-xs text-muted-foreground">@{u.username}</span>
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{u.email ?? "—"}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {new Date(u.created_at).toLocaleDateString(locale)}
                  </td>
                  <td className="px-4 py-3">
                    {u.draftSurgeonId ? (
                      <Link
                        href={`/admin/surgeons/${u.draftSurgeonId}`}
                        className="text-primary hover:underline"
                      >
                        {t("unstartedDraftBadge")}
                      </Link>
                    ) : (
                      <Badge variant="outline">{t("unstartedNoneBadge")}</Badge>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <DeleteUnstartedUserButton
                      userId={u.id}
                      displayName={u.full_name ?? u.username}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <form
        className="surface-flat flex flex-wrap items-end gap-3 p-3"
        method="GET"
        aria-label={t("filterAriaLabel")}
      >
        <div className="flex flex-col gap-1">
          <label htmlFor="status" className="text-xs font-medium text-muted-foreground">
            {t("statusLabel")}
          </label>
          <select
            id="status"
            name="status"
            defaultValue={status ?? ""}
            className="h-9 rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
          >
            <option value="">{t("allStatuses")}</option>
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {tStatus(s)}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="country" className="text-xs font-medium text-muted-foreground">
            {t("countryLabel")}
          </label>
          <input
            id="country"
            name="country"
            placeholder={t("countryPlaceholder")}
            defaultValue={country ?? ""}
            className="h-9 w-36 rounded-lg border border-input bg-transparent px-3 text-sm outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label htmlFor="q" className="text-xs font-medium text-muted-foreground">
            {t("searchLabel")}
          </label>
          <input
            id="q"
            name="q"
            placeholder={t("searchPlaceholder")}
            defaultValue={q ?? ""}
            className="h-9 w-48 rounded-lg border border-input bg-transparent px-3 text-sm outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
          />
        </div>
        <button
          type="submit"
          className="h-9 cursor-pointer rounded-lg bg-primary px-4 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/80"
        >
          {t("filterButton")}
        </button>
        {(status || country || q) && (
          <Link
            href="/admin/surgeons"
            className="h-9 content-center text-sm text-muted-foreground hover:text-foreground hover:underline"
          >
            {t("clearFilters")}
          </Link>
        )}
      </form>

      <div className="surface-flat overflow-x-auto">
        <table className="w-full min-w-[640px] text-sm">
          <thead className="border-b border-border bg-secondary/40 text-left text-xs font-medium tracking-wide text-muted-foreground uppercase">
            <tr>
              <th className="px-4 py-3">{t("nameHeader")}</th>
              <th className="px-4 py-3">{t("specialtyHeader")}</th>
              <th className="px-4 py-3">{t("statusHeader")}</th>
              <th className="px-4 py-3">{t("submittedHeader")}</th>
            </tr>
          </thead>
          <tbody>
            {surgeons.map((s) => (
              <tr key={s.id} className="border-b border-border last:border-0 hover:bg-secondary/30">
                <td className="px-4 py-3">
                  <Link
                    href={`/admin/surgeons/${s.id}`}
                    className="font-medium text-primary hover:underline"
                  >
                    {s.full_name}
                  </Link>
                  {s.is_demo && (
                    <span className="ml-2 text-xs text-muted-foreground">{t("demoTag")}</span>
                  )}
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {PRIMARY_SPECIALTY_LABELS[s.primary_specialty]}
                </td>
                <td className="px-4 py-3">
                  <Badge variant={STATUS_VARIANT[s.status]}>{tStatus(s.status)}</Badge>
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {s.submitted_at ? new Date(s.submitted_at).toLocaleDateString(locale) : "—"}
                </td>
              </tr>
            ))}
            {surgeons.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-10 text-center text-muted-foreground">
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
