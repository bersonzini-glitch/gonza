import { Plus } from "lucide-react";
import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";

import { AiEventSearchButton } from "@/components/admin/ai-event-search-button";
import { EventReviewActions } from "@/components/admin/event-review-actions";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDateRange } from "@/lib/format";
import { getLatestAiEventSearchRun, listEventsForAdmin } from "@/lib/data/admin";

export async function generateMetadata({
  params,
}: PageProps<"/[locale]/admin/events">): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "adminEventsPage" });
  return { title: t("metaTitle") };
}

export const dynamic = "force-dynamic";

// The AI search's own web-research call can run well past typical
// serverless defaults; this raises the ceiling for the Server Actions
// invoked from this page (see triggerAiEventSearchAction in
// lib/actions/admin.ts). Vercel clamps this to whatever the project's
// plan allows, so it's safe to ask for more than is guaranteed.
export const maxDuration = 300;

const AI_SEARCH_BADGE_VARIANT = {
  started: "outline",
  completed: "secondary",
  failed: "destructive",
} as const;

export default async function AdminEventsPage({ params }: PageProps<"/[locale]/admin/events">) {
  const { locale } = await params;
  const [events, latestSearch] = await Promise.all([
    listEventsForAdmin(),
    getLatestAiEventSearchRun(),
  ]);
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
        <div className="flex items-center gap-2">
          <AiEventSearchButton />
          <Button asChild>
            <Link href="/admin/events/new">
              <Plus className="size-4" /> {t("newEvent")}
            </Link>
          </Button>
        </div>
      </div>

      {latestSearch && (
        <div className="surface-flat flex items-center gap-2 px-4 py-3 text-sm">
          <Badge variant={AI_SEARCH_BADGE_VARIANT[latestSearch.status]}>
            {t(`aiSearchStatus.${latestSearch.status}`)}
          </Badge>
          <span className="text-muted-foreground">
            {latestSearch.status === "completed"
              ? t("aiSearchLastRunCompleted", {
                  inserted: Number(latestSearch.metadata.inserted ?? 0),
                  date: new Date(latestSearch.createdAt).toLocaleString(locale),
                })
              : latestSearch.status === "failed"
                ? t("aiSearchLastRunFailed", {
                    date: new Date(latestSearch.createdAt).toLocaleString(locale),
                  })
                : t("aiSearchLastRunStarted", {
                    date: new Date(latestSearch.createdAt).toLocaleString(locale),
                  })}
          </span>
        </div>
      )}

      <div className="surface-flat overflow-x-auto">
        <table className="w-full min-w-[720px] text-sm">
          <thead className="border-b border-border bg-secondary/40 text-left text-xs font-medium tracking-wide text-muted-foreground uppercase">
            <tr>
              <th className="px-4 py-3">{t("titleHeader")}</th>
              <th className="px-4 py-3">{t("dateHeader")}</th>
              <th className="px-4 py-3">{t("countryHeader")}</th>
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
