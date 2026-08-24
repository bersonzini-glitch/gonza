import { Activity } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";

export async function SiteFooter() {
  const t = await getTranslations("footer");

  const FOOTER_LINKS = [
    {
      heading: t("discoverHeading"),
      links: [
        { href: "/events", label: t("searchEvents") },
        { href: "/surgeons", label: t("surgeonDirectory") },
      ],
    },
    {
      heading: t("aboutHeading"),
      links: [
        { href: "/about", label: t("aboutUs") },
        { href: "/privacy", label: t("privacy") },
      ],
    },
    {
      heading: t("forSurgeonsHeading"),
      links: [
        { href: "/sign-up", label: t("createProfile") },
        { href: "/sign-in", label: t("signIn") },
      ],
    },
  ];

  return (
    <footer className="mt-auto border-t border-border bg-secondary/40">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4">
          <div className="max-w-xs">
            <div className="flex items-center gap-2 font-heading text-lg font-semibold">
              <Activity className="size-5 text-primary" aria-hidden="true" />
              <span>
                Columna<span className="text-primary">LATAM</span>
              </span>
            </div>
            <p className="mt-3 text-sm text-muted-foreground">{t("tagline")}</p>
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
          <p>{t("copyright", { year: new Date().getFullYear() })}</p>
          <p>{t("emergencyDisclaimer")}</p>
        </div>
      </div>
    </footer>
  );
}
