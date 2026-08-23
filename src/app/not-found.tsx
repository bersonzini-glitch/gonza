import { CompassIcon } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center px-4 text-center">
      <CompassIcon className="size-10 text-muted-foreground" aria-hidden="true" />
      <h1 className="mt-4 font-heading text-2xl font-semibold text-foreground">
        Página no encontrada
      </h1>
      <p className="mt-2 text-muted-foreground">
        La página que buscás no existe o puede haber sido movida.
      </p>
      <div className="mt-6 flex gap-3">
        <Button asChild>
          <Link href="/">Ir al inicio</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/events">Ver congresos</Link>
        </Button>
      </div>
    </div>
  );
}
