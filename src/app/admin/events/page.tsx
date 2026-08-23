import { Plus } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDateRange } from "@/lib/format";
import { listEventsForAdmin } from "@/lib/data/admin";

export const metadata: Metadata = { title: "Gestionar eventos" };
export const dynamic = "force-dynamic";

const EVENT_STATUS_LABELS: Record<string, string> = {
  pending: "pendiente",
  approved: "aprobado",
  rejected: "rechazado",
};

export default async function AdminEventsPage() {
  const events = await listEventsForAdmin();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h2 className="font-heading text-2xl font-semibold text-foreground">
            Gestionar eventos
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {events.length} {events.length === 1 ? "evento" : "eventos"} en el índice.
          </p>
        </div>
        <Button asChild>
          <Link href="/admin/events/new">
            <Plus className="size-4" /> Nuevo evento
          </Link>
        </Button>
      </div>

      <div className="surface-flat overflow-x-auto">
        <table className="w-full min-w-[640px] text-sm">
          <thead className="border-b border-border bg-secondary/40 text-left text-xs font-medium tracking-wide text-muted-foreground uppercase">
            <tr>
              <th className="px-4 py-3">Título</th>
              <th className="px-4 py-3">Fecha</th>
              <th className="px-4 py-3">País</th>
              <th className="px-4 py-3">Estado</th>
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
                    <span className="ml-2 text-xs text-muted-foreground">★ destacado</span>
                  )}
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {formatDateRange(event.start_date, event.end_date)}
                </td>
                <td className="px-4 py-3 text-muted-foreground">{event.country}</td>
                <td className="px-4 py-3">
                  <Badge variant={event.status === "approved" ? "secondary" : "outline"}>
                    {EVENT_STATUS_LABELS[event.status]}
                  </Badge>
                </td>
              </tr>
            ))}
            {events.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-10 text-center text-muted-foreground">
                  Todavía no hay eventos.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
