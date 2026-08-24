"use client";

import { Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { useTransition } from "react";
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
import { deleteEventAction } from "@/lib/actions/admin";

export function DeleteEventButton({ eventId }: { eventId: string }) {
  const router = useRouter();
  const t = useTranslations("eventForm");
  const [isPending, startTransition] = useTransition();

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="destructive" type="button">
          <Trash2 className="size-4" /> {t("deleteEvent")}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("deleteEventTitle")}</DialogTitle>
          <DialogDescription>{t("deleteEventDescription")}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            variant="destructive"
            disabled={isPending}
            onClick={() =>
              startTransition(async () => {
                const result = await deleteEventAction(eventId);
                if (result.error) {
                  toast.error(result.error);
                  return;
                }
                toast.success(t("eventDeletedToast"));
                router.push("/admin/events");
                router.refresh();
              })
            }
          >
            {isPending ? t("deleting") : t("deletePermanently")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
