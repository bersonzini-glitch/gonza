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
import { deleteSocietyAction } from "@/lib/actions/admin";

export function DeleteSocietyButton({ societyId }: { societyId: string }) {
  const router = useRouter();
  const t = useTranslations("societyForm");
  const [isPending, startTransition] = useTransition();

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="destructive" type="button">
          <Trash2 className="size-4" /> {t("deleteSociety")}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("deleteSocietyTitle")}</DialogTitle>
          <DialogDescription>{t("deleteSocietyDescription")}</DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            variant="destructive"
            disabled={isPending}
            onClick={() =>
              startTransition(async () => {
                const result = await deleteSocietyAction(societyId);
                if (result.error) {
                  toast.error(result.error);
                  return;
                }
                toast.success(t("societyDeletedToast"));
                router.push("/admin/scientific-societies");
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
