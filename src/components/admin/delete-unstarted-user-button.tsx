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
import { deleteUnstartedUserAction } from "@/lib/actions/admin";

export function DeleteUnstartedUserButton({
  userId,
  displayName,
}: {
  userId: string;
  displayName: string;
}) {
  const router = useRouter();
  const t = useTranslations("adminSurgeonsPage");
  const [isPending, startTransition] = useTransition();

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" type="button">
          <Trash2 className="size-3.5" aria-hidden="true" />
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t("deleteUserTitle")}</DialogTitle>
          <DialogDescription>
            {t("deleteUserDescription", { name: displayName })}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button
            variant="destructive"
            disabled={isPending}
            onClick={() =>
              startTransition(async () => {
                const result = await deleteUnstartedUserAction(userId);
                if (result.error) {
                  toast.error(result.error);
                  return;
                }
                toast.success(t("userDeletedToast"));
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
