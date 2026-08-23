"use client";

import { Send } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { submitSurgeonProfileAction } from "@/lib/actions/surgeon";

export function SubmitButton() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  return (
    <div>
      <Button
        type="button"
        disabled={isPending}
        onClick={() =>
          startTransition(async () => {
            setError(null);
            const result = await submitSurgeonProfileAction();
            if (result.error) {
              setError(result.error);
              return;
            }
            toast.success("Perfil enviado a revisión");
            router.refresh();
          })
        }
      >
        <Send className="size-4" />
        {isPending ? "Enviando…" : "Enviar a revisión"}
      </Button>
      {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
    </div>
  );
}
