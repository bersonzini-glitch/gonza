import { CalendarRange, LayoutDashboard, ScrollText, Users } from "lucide-react";
import type { ReactNode } from "react";

import { NavLink } from "@/components/shared/nav-link";
import { requireAdmin } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

const ADMIN_NAV = [
  { href: "/admin", label: "Resumen", icon: LayoutDashboard, exact: true },
  { href: "/admin/surgeons", label: "Cola de cirujanos", icon: Users, exact: false },
  { href: "/admin/events", label: "Eventos", icon: CalendarRange, exact: false },
  { href: "/admin/audit-log", label: "Historial de auditoría", icon: ScrollText, exact: false },
] as const;

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const admin = await requireAdmin("/admin");

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="flex items-center gap-3">
        <h1 className="font-heading text-3xl font-semibold text-foreground">
          Panel de administración
        </h1>
      </div>
      <p className="mt-1.5 text-sm text-muted-foreground">
        Conectado como <span className="font-medium text-foreground">{admin.username}</span>
      </p>

      <div className="mt-8 grid gap-6 lg:grid-cols-[240px_1fr] lg:gap-8">
        <nav
          aria-label="Administración"
          className="flex gap-1 overflow-x-auto rounded-xl border border-border bg-card p-2 lg:flex-col lg:self-start"
        >
          {ADMIN_NAV.map((item) => (
            <NavLink
              key={item.href}
              href={item.href}
              exact={item.exact}
              className="flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
              activeClassName="bg-primary/10 text-primary hover:bg-primary/10 hover:text-primary"
            >
              <item.icon className="size-4" aria-hidden="true" />
              {item.label}
            </NavLink>
          ))}
        </nav>
        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}
