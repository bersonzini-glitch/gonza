import { Activity } from "lucide-react";
import Link from "next/link";

const FOOTER_LINKS = [
  {
    heading: "Discover",
    links: [
      { href: "/events", label: "Congress search" },
      { href: "/surgeons", label: "Surgeon directory" },
    ],
  },
  {
    heading: "About",
    links: [
      { href: "/about", label: "About & data sources" },
      { href: "/privacy", label: "Privacy & medical disclaimer" },
    ],
  },
  {
    heading: "For surgeons",
    links: [
      { href: "/sign-up", label: "Create your profile" },
      { href: "/sign-in", label: "Sign in" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-border bg-secondary/40">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div className="max-w-xs">
            <div className="flex items-center gap-2 font-heading text-lg font-semibold">
              <Activity className="size-5 text-primary" aria-hidden="true" />
              <span>
                Columna<span className="text-primary">LATAM</span>
              </span>
            </div>
            <p className="mt-3 text-sm text-muted-foreground">
              An independent directory of LATAM spine surgery congresses and verified spine
              surgeons. Informational only — not a substitute for medical advice.
            </p>
          </div>

          {FOOTER_LINKS.map((group) => (
            <div key={group.heading}>
              <h2 className="text-sm font-semibold text-foreground">{group.heading}</h2>
              <ul className="mt-3 space-y-2">
                {group.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-10 flex flex-col gap-2 border-t border-border pt-6 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {new Date().getFullYear()} ColumnaLATAM. All event and surgeon data is sourced or
            submitted as described on our data sources page.
          </p>
          <p>
            Not for medical emergencies. In an emergency, contact local emergency services
            immediately.
          </p>
        </div>
      </div>
    </footer>
  );
}
