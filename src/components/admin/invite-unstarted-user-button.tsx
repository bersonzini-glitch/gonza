"use client";

import { Mail } from "lucide-react";
import { useTranslations } from "next-intl";
import { useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { inviteUnstartedUserAction } from "@/lib/actions/admin";

export function InviteUnstartedUserButton({ userId }: { userId: string }) {
  const t = useTranslations("adminSurgeonsPage");
  const [isPending, startTransition] = useTransition();

  return (
    <Button
      variant="ghost"
      size="sm"
      type="button"
      disabled={isPending}
      onClick={() =>
        startTransition(async () => {
          const result = await inviteUnstartedUserAction(userId);
          if (result.error) {
            toast.error(result.error);
            return;
          }
          toast.success(t("inviteSentToast"));
        })
      }
    >
      <Mail className="size-3.5" aria-hidden="true" />
      {isPending ? t("inviting") : t("inviteButton")}
    </Button>
  );
}
