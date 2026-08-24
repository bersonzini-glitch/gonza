import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";

import { listAuditLogs } from "@/lib/data/admin";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/admin/audit-log">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "adminAuditLog" });
  return { title: t("metaTitle") };
}

export const dynamic = "force-dynamic";

const LOCALE_TAGS: Record<string, string> = { es: "es-419", en: "en-US", pt: "pt-BR" };

export default async function AdminAuditLogPage({
  params,
}: PageProps<"/[locale]/admin/audit-log">) {
  const { locale } = await params;
  const logs = await listAuditLogs();
  const t = await getTranslations("adminAuditLog");
  const localeTag = LOCALE_TAGS[locale] ?? LOCALE_TAGS.es;

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">{t("description")}</p>

      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full min-w-[720px] text-sm">
          <thead className="border-b border-border bg-secondary/40 text-left text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-4 py-3">{t("whenHeader")}</th>
              <th className="px-4 py-3">{t("adminHeader")}</th>
              <th className="px-4 py-3">{t("actionHeader")}</th>
              <th className="px-4 py-3">{t("targetHeader")}</th>
              <th className="px-4 py-3">{t("detailsHeader")}</th>
            </tr>
          </thead>
          <tbody>
            {logs.map((log) => (
              <tr key={log.id} className="border-b border-border last:border-0">
                <td className="px-4 py-3 whitespace-nowrap text-muted-foreground">
                  {new Date(log.created_at).toLocaleString(localeTag)}
                </td>
                <td className="px-4 py-3">
                  {(log as unknown as { profiles: { username: string } | null }).profiles
                    ?.username ?? "—"}
                </td>
                <td className="px-4 py-3 font-medium text-foreground">{log.action}</td>
                <td className="px-4 py-3 text-muted-foreground">
                  {log.target_table}
                  {log.target_id ? ` #${log.target_id.slice(0, 8)}` : ""}
                </td>
                <td className="px-4 py-3 text-xs text-muted-foreground">
                  {Object.keys(log.metadata ?? {}).length > 0 ? JSON.stringify(log.metadata) : "—"}
                </td>
              </tr>
            ))}
            {logs.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-muted-foreground">
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
