import { CalendarRange, LayoutDashboard, ScrollText, Users } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

import { requireAdmin } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

const ADMIN_NAV = [
  { href: "/admin", label: "Overview", icon: LayoutDashboard },
  { href: "/admin/surgeons", label: "Surgeon queue", icon: Users },
  { href: "/admin/events", label: "Events", icon: CalendarRange },
  { href: "/admin/audit-log", label: "Audit log", icon: ScrollText },
] as const;

export default async function AdminLayout({ children }: { children: ReactNode }) {
  await requireAdmin("/admin");

  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
      <h1 className="font-heading text-3xl font-semibold text-foreground">Admin dashboard</h1>

      <div className="mt-8 grid gap-8 lg:grid-cols-[220px_1fr]">
        <nav aria-label="Admin" className="flex gap-1 overflow-x-auto lg:flex-col">
          {ADMIN_NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="flex shrink-0 items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            >
              <item.icon className="size-4" aria-hidden="true" />
              {item.label}
            </Link>
          ))}
        </nav>
        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}
