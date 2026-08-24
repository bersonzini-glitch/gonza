import { Activity } from "lucide-react";
import { Link } from "@/i18n/navigation";

import { MobileNav } from "@/components/layout/mobile-nav";
import { UserMenu } from "@/components/layout/user-menu";
import { LanguageToggle } from "@/components/shared/language-toggle";
import { NavLink } from "@/components/shared/nav-link";
import { ThemeToggle } from "@/components/shared/theme-toggle";
import { getCurrentProfile } from "@/lib/auth/session";
import { NAV_LINKS } from "@/lib/nav-links";

export async function SiteHeader() {
  const profile = await getCurrentProfile();

  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/85 backdrop-blur supports-backdrop-filter:bg-background/70">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          className="flex items-center gap-2 rounded-md font-heading text-lg font-semibold tracking-tight text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <Activity className="size-4.5" aria-hidden="true" />
          </span>
          <span>
            Columna<span className="text-primary">LATAM</span>
          </span>
        </Link>

        <nav aria-label="Principal" className="hidden items-center gap-1 md:flex">
          {NAV_LINKS.map((link) => (
            <NavLink
              key={link.href}
              href={link.href}
              className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              activeClassName="bg-secondary text-foreground"
            >
              {link.label}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-1.5">
          <LanguageToggle />
          <ThemeToggle />
          <div className="hidden md:block">
            <UserMenu profile={profile} />
          </div>
          <MobileNav profile={profile} />
        </div>
      </div>
    </header>
  );
}
