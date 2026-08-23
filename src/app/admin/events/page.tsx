import { Plus } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDateRange } from "@/lib/format";
import { listEventsForAdmin } from "@/lib/data/admin";

export const metadata: Metadata = { title: "Manage events" };
export const dynamic = "force-dynamic";

export default async function AdminEventsPage() {
  const events = await listEventsForAdmin();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{events.length} events</p>
        <Button asChild>
          <Link href="/admin/events/new">
            <Plus className="size-4" /> New event
          </Link>
        </Button>
      </div>

      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full min-w-[640px] text-sm">
          <thead className="border-b border-border bg-secondary/40 text-left text-xs uppercase text-muted-foreground">
            <tr>
              <th className="px-4 py-3">Title</th>
              <th className="px-4 py-3">Date</th>
              <th className="px-4 py-3">Country</th>
              <th className="px-4 py-3">Status</th>
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
                    <span className="ml-2 text-xs text-muted-foreground">★ featured</span>
                  )}
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {formatDateRange(event.start_date, event.end_date)}
                </td>
                <td className="px-4 py-3 text-muted-foreground">{event.country}</td>
                <td className="px-4 py-3">
                  <Badge variant={event.status === "approved" ? "secondary" : "outline"}>
                    {event.status}
                  </Badge>
                </td>
              </tr>
            ))}
            {events.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-10 text-center text-muted-foreground">
                  No events yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
