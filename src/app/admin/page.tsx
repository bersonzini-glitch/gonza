import { CalendarCheck, Clock, ShieldCheck, Users } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { getAdminOverviewMetrics } from "@/lib/data/admin";

export const metadata: Metadata = { title: "Resumen de administración" };

export default async function AdminOverviewPage() {
  const metrics = await getAdminOverviewMetrics();

  const cards = [
    {
      label: "Cirujanos pendientes de revisión",
      value: metrics.pendingSurgeons,
      icon: Clock,
      href: "/admin/surgeons?status=submitted",
      highlight: metrics.pendingSurgeons > 0,
    },
    {
      label: "Cirujanos aprobados",
      value: metrics.approvedSurgeons,
      icon: ShieldCheck,
      href: "/admin/surgeons?status=approved",
    },
    {
      label: "Total de perfiles de cirujanos",
      value: metrics.totalSurgeons,
      icon: Users,
      href: "/admin/surgeons",
    },
    {
      label: "Eventos publicados",
      value: metrics.approvedEvents,
      icon: CalendarCheck,
      href: "/admin/events",
    },
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <Link
            key={card.label}
            href={card.href}
            className={`rounded-xl border p-5 transition-colors hover:border-primary/40 ${
              card.highlight ? "border-primary/40 bg-accent/30" : "border-border bg-card"
            }`}
          >
            <card.icon className="size-5 text-primary" aria-hidden="true" />
            <p className="mt-3 font-heading text-3xl font-semibold text-foreground">{card.value}</p>
            <p className="mt-1 text-sm text-muted-foreground">{card.label}</p>
          </Link>
        ))}
      </div>

      {metrics.pendingSurgeons > 0 && (
        <div className="rounded-xl border border-primary/30 bg-accent/20 p-5">
          <p className="text-sm text-foreground">
            <strong>{metrics.pendingSurgeons}</strong>{" "}
            {metrics.pendingSurgeons === 1
              ? "perfil de cirujano está"
              : "perfiles de cirujanos están"}{" "}
            esperando revisión.
          </p>
          <Link
            href="/admin/surgeons?status=submitted"
            className="mt-2 inline-block text-sm font-medium text-primary hover:underline"
          >
            Revisar ahora →
          </Link>
        </div>
      )}
    </div>
  );
}
