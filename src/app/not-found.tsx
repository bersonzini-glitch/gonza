import Link from "next/link";

import "./globals.css";

// Safety net for paths that don't resolve to any [locale]/... route at all
// (so [locale]/not-found.tsx never gets a chance to render). Next requires
// a root layout for this file to exist, but since [locale]/layout.tsx is
// effectively the site's real root layout, this stays minimal on purpose —
// it only needs to happen for genuinely malformed URLs.
export default function RootNotFound() {
  return (
    <html lang="es">
      <body className="flex min-h-screen flex-col items-center justify-center bg-background px-4 text-center text-foreground">
        <h1 className="font-heading text-2xl font-semibold">Página no encontrada</h1>
        <p className="mt-2 text-muted-foreground">
          La página que buscás no existe o puede haber sido movida.
        </p>
        <Link href="/" className="mt-6 text-primary underline underline-offset-4">
          Ir al inicio
        </Link>
      </body>
    </html>
  );
}
