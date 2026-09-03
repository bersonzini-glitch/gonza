"use client";

import { Megaphone } from "lucide-react";
import { useTranslations } from "next-intl";
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
import { sendEventAnnouncementAction } from "@/lib/actions/admin";

export function NotifyInterestedSurgeonsButton({ eventId }: { eventId: string }) {
  const t = useTranslations("eventForm");
  const [isPending, startTransition] = useTransition();

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" type="button">
          <Megaphone className="size-4" aria-hidden="true" />
          {t("notifyInterestedSurgeons")}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("notifyInterestedSurgeonsTitle")}</DialogTitle>
          <DialogDescription>{t("notifyInterestedSurgeonsDescription")}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            disabled={isPending}
            onClick={() =>
              startTransition(async () => {
                const result = await sendEventAnnouncementAction(eventId);
                if (result.error) {
                  toast.error(result.error);
                  return;
                }
                toast.success(
                  t("notifyInterestedSurgeonsSentToast", { count: result.recipientCount ?? 0 }),
                );
              })
            }
          >
            {isPending
              ? t("notifyInterestedSurgeonsSending")
              : t("notifyInterestedSurgeonsConfirm")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
