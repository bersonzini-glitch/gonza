"use client";

import { Check, Trash2, X, ShieldAlert } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  approveSurgeonAction,
  deleteSurgeonAction,
  rejectSurgeonAction,
  suspendSurgeonAction,
} from "@/lib/actions/admin";
import type { SurgeonStatus } from "@/types/database";

function ReasonDialog({
  trigger,
  title,
  description,
  onConfirm,
  redirectTo,
}: {
  trigger: React.ReactNode;
  title: string;
  description: string;
  onConfirm: (reason: string) => Promise<{ error?: string; success?: boolean }>;
  redirectTo?: string;
}) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div className="space-y-1.5">
          <Label htmlFor="reason">Motivo</Label>
          <Textarea
            id="reason"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={4}
          />
          {error && <p className="text-xs text-destructive">{error}</p>}
        </div>
        <DialogFooter>
          <Button
            disabled={isPending}
            onClick={() =>
              startTransition(async () => {
                const result = await onConfirm(reason);
                if (result.error) {
                  setError(result.error);
                  return;
                }
                setOpen(false);
                toast.success("Listo");
                if (redirectTo) router.push(redirectTo);
                else router.refresh();
              })
            }
          >
            {isPending ? "Enviando…" : "Confirmar"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function SurgeonReviewActions({
  surgeonId,
  status,
}: {
  surgeonId: string;
  status: SurgeonStatus;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();

  return (
    <div className="flex flex-wrap gap-2">
      {(status === "submitted" || status === "rejected" || status === "suspended") && (
        <Button
          disabled={isPending}
          onClick={() =>
            startTransition(async () => {
              const result = await approveSurgeonAction(surgeonId);
              if (result.error) toast.error(result.error);
              else {
                toast.success("Perfil aprobado");
                router.refresh();
              }
            })
          }
        >
          <Check className="size-4" /> Aprobar
        </Button>
      )}

      {status === "submitted" && (
        <ReasonDialog
          trigger={
            <Button variant="outline">
              <X className="size-4" /> Rechazar
            </Button>
          }
          title="Rechazar este perfil"
          description="Explicá qué necesita cambiar el cirujano. Verá esta nota en su panel."
          onConfirm={(reason) => rejectSurgeonAction(surgeonId, reason)}
        />
      )}

      {status === "approved" && (
        <ReasonDialog
          trigger={
            <Button variant="outline">
              <ShieldAlert className="size-4" /> Suspender
            </Button>
          }
          title="Suspender este perfil"
          description="El perfil se quitará de la vista pública inmediatamente."
          onConfirm={(reason) => suspendSurgeonAction(surgeonId, reason)}
        />
      )}

      <ReasonDialog
        trigger={
          <Button variant="destructive">
            <Trash2 className="size-4" /> Eliminar
          </Button>
        }
        title="Eliminar este perfil permanentemente"
        description="Esta acción no se puede deshacer. El motivo se registra en el historial de auditoría antes de eliminar."
        onConfirm={async () => deleteSurgeonAction(surgeonId)}
        redirectTo="/admin/surgeons"
      />
    </div>
  );
}
