"use client";

import { AlertTriangle } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { useEffect } from "react";

import { Button } from "@/components/ui/button";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center px-4 text-center">
      <AlertTriangle className="size-10 text-destructive" aria-hidden="true" />
      <h1 className="mt-4 font-heading text-2xl font-semibold text-foreground">
        Algo salió mal
      </h1>
      <p className="mt-2 text-muted-foreground">
        Ocurrió un error inesperado al cargar esta página. Podés intentar de nuevo o volver al
        inicio.
      </p>
      <div className="mt-6 flex gap-3">
        <Button onClick={reset}>Intentar de nuevo</Button>
        <Button variant="outline" asChild>
          <Link href="/">Ir al inicio</Link>
        </Button>
      </div>
    </div>
  );
}
