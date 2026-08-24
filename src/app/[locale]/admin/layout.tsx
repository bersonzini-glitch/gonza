import { CalendarRange, LayoutDashboard, ScrollText, Users } from "lucide-react";
import { getTranslations } from "next-intl/server";
import type { ReactNode } from "react";

import { NavLink } from "@/components/shared/nav-link";
import { requireAdmin } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const admin = await requireAdmin("/admin");
  const t = await getTranslations("adminLayout");

  const ADMIN_NAV = [
    { href: "/admin", label: t("navOverview"), icon: LayoutDashboard, exact: true },
    { href: "/admin/surgeons", label: t("navSurgeonQueue"), icon: Users, exact: false },
    { href: "/admin/events", label: t("navEvents"), icon: CalendarRange, exact: false },
    { href: "/admin/audit-log", label: t("navAuditLog"), icon: ScrollText, exact: false },
  ] as const;

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <div className="flex items-center gap-3">
        <h1 className="font-heading text-3xl font-semibold text-foreground">{t("title")}</h1>
      </div>
      <p className="mt-1.5 text-sm text-muted-foreground">
        {t("connectedAs")} <span className="font-medium text-foreground">{admin.username}</span>
      </p>

      <div className="mt-8 grid grid-cols-1 gap-6 lg:grid-cols-[240px_1fr] lg:gap-8">
        <nav
          aria-label={t("navLabel")}
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
