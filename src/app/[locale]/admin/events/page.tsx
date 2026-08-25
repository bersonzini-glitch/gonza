import { Plus } from "lucide-react";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";

import { EventReviewActions } from "@/components/admin/event-review-actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDateRange } from "@/lib/format";
import { listEventsForAdmin } from "@/lib/data/admin";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/admin/events">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "adminEventsPage" });
  return { title: t("metaTitle") };
}

export const dynamic = "force-dynamic";

export default async function AdminEventsPage({ params }: PageProps<"/[locale]/admin/events">) {
  const { locale } = await params;
  const events = await listEventsForAdmin();
  const [t, tStatus] = await Promise.all([
    getTranslations({ locale, namespace: "adminEventsPage" }),
    getTranslations({ locale, namespace: "adminEventStatus" }),
  ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="font-heading text-2xl font-semibold text-foreground">{t("heading")}</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {t("countLabel", { count: events.length })}
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/events/new">
            <Plus className="size-4" /> {t("newEvent")}
          </Link>
        </Button>
      </div>

      <div className="surface-flat overflow-x-auto">
        <table className="w-full min-w-[720px] text-sm">
          <thead className="border-b border-border bg-secondary/40 text-left text-xs font-medium tracking-wide text-muted-foreground uppercase">
            <tr>
              <th className="px-4 py-3">{t("titleHeader")}</th>
              <th className="px-4 py-3">{t("dateHeader")}</th>
              <th className="px-4 py-3">{t("countryHeader")}</th>
              <th className="px-4 py-3">{t("languageHeader")}</th>
              <th className="px-4 py-3">{t("statusHeader")}</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {events.map((event) => (
              <tr
                key={event.id}
                className="border-b border-border last:border-0 hover:bg-secondary/30"
              >
                <td className="px-4 py-3">
                  <Link
                    href={`/admin/events/${event.id}/edit`}
                    className="font-medium text-primary hover:underline"
                  >
                    {event.title}
                  </Link>
                  {event.is_featured && (
                    <span className="ml-2 text-xs text-muted-foreground">{t("featuredTag")}</span>
                  )}
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {formatDateRange(event.start_date, event.end_date, locale)}
                </td>
                <td className="px-4 py-3 text-muted-foreground">{event.country}</td>
                <td className="px-4 py-3 text-muted-foreground">{event.language}</td>
                <td className="px-4 py-3">
                  <Badge
                    variant={
                      event.status === "approved"
                        ? "secondary"
                        : event.status === "rejected"
                          ? "destructive"
                          : "outline"
                    }
                  >
                    {tStatus(event.status)}
                  </Badge>
                </td>
                <td className="px-4 py-3">
                  {event.status === "pending" && <EventReviewActions eventId={event.id} />}
                </td>
              </tr>
            ))}
            {events.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-muted-foreground">
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
