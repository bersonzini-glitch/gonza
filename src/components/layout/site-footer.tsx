import { Activity } from "lucide-react";
import Link from "next/link";

const FOOTER_LINKS = [
  {
    heading: "Descubrir",
    links: [
      { href: "/events", label: "Buscar congresos" },
      { href: "/surgeons", label: "Directorio de cirujanos" },
    ],
  },
  {
    heading: "Sobre nosotros",
    links: [
      { href: "/about", label: "Quiénes somos y fuentes" },
      { href: "/privacy", label: "Privacidad y aviso médico" },
    ],
  },
  {
    heading: "Para cirujanos",
    links: [
      { href: "/sign-up", label: "Creá tu perfil" },
      { href: "/sign-in", label: "Iniciar sesión" },
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
              Un directorio independiente de congresos de cirugía de columna y cirujanos
              verificados en Latinoamérica. Es solo informativo — no reemplaza el consejo médico
              profesional.
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
            © {new Date().getFullYear()} ColumnaLATAM. Todos los datos de eventos y cirujanos
            provienen de fuentes verificadas o fueron enviados según se explica en nuestra página
            de fuentes de datos.
          </p>
          <p>
            No es un servicio de emergencias médicas. Ante una emergencia, contactá a los
            servicios de emergencia locales de inmediato.
          </p>
        </div>
      </div>
    </footer>
  );
}
