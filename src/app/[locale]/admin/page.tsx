import { CalendarCheck, Clock, ShieldCheck, Users } from "lucide-react";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";

import { getAdminOverviewMetrics } from "@/lib/data/admin";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/admin">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "adminOverview" });
  return { title: t("metaTitle") };
}

export default async function AdminOverviewPage() {
  const metrics = await getAdminOverviewMetrics();
  const t = await getTranslations("adminOverview");

  const cards = [
    {
      label: t("pendingSurgeonsCard"),
      value: metrics.pendingSurgeons,
      icon: Clock,
      href: "/admin/surgeons?status=submitted",
      highlight: metrics.pendingSurgeons > 0,
    },
    {
      label: t("approvedSurgeonsCard"),
      value: metrics.approvedSurgeons,
      icon: ShieldCheck,
      href: "/admin/surgeons?status=approved",
    },
    {
      label: t("totalSurgeonsCard"),
      value: metrics.totalSurgeons,
      icon: Users,
      href: "/admin/surgeons",
    },
    {
      label: t("publishedEventsCard"),
      value: metrics.approvedEvents,
      icon: CalendarCheck,
      href: "/admin/events",
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-heading text-2xl font-semibold text-foreground">{t("heading")}</h2>
        <p className="mt-1 text-sm text-muted-foreground">{t("subtitle")}</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <Link
            key={card.label}
            href={card.href}
            className={`group rounded-xl border p-5 transition-all hover:-translate-y-0.5 hover:shadow-[0_8px_24px_-12px_rgba(15,23,42,0.18)] ${
              card.highlight
                ? "border-primary/30 bg-primary/5"
                : "border-border bg-card hover:border-primary/30"
            }`}
          >
            <span
              className={`flex size-9 items-center justify-center rounded-lg ${
                card.highlight
                  ? "bg-primary text-primary-foreground"
                  : "bg-secondary text-primary"
              }`}
            >
              <card.icon className="size-4.5" aria-hidden="true" />
            </span>
            <p className="mt-3 font-heading text-3xl font-semibold text-foreground">{card.value}</p>
            <p className="mt-1 text-sm text-muted-foreground">{card.label}</p>
          </Link>
        ))}
      </div>

      {metrics.pendingSurgeons > 0 && (
        <div className="surface-raised flex flex-wrap items-center justify-between gap-3 border-primary/30 bg-primary/5 p-5">
          <p className="text-sm text-foreground">
            {t.rich("pendingBanner", {
              count: metrics.pendingSurgeons,
              strong: (chunks) => <strong>{chunks}</strong>,
            })}
          </p>
          <Link
            href="/admin/surgeons?status=submitted"
            className="text-sm font-medium text-primary hover:underline"
          >
            {t("reviewNow")}
          </Link>
        </div>
      )}
    </div>
  );
}
