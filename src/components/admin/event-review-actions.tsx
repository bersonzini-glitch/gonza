"use client";

import { Check, X } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { approveEventAction, rejectEventAction } from "@/lib/actions/admin";

export function EventReviewActions({ eventId }: { eventId: string }) {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations("adminActions");
  const [isPending, startTransition] = useTransition();

  return (
    <div className="flex items-center gap-1.5">
      <Button
        type="button"
        size="sm"
        variant="outline"
        disabled={isPending}
        onClick={() =>
          startTransition(async () => {
            const result = await approveEventAction(locale, eventId);
            if (result.error) toast.error(result.error);
            else {
              toast.success(t("eventApprovedToast"));
              router.refresh();
            }
          })
        }
      >
        <Check className="size-4" /> {t("approve")}
      </Button>
      <Button
        type="button"
        size="sm"
        variant="outline"
        disabled={isPending}
        onClick={() =>
          startTransition(async () => {
            const result = await rejectEventAction(locale, eventId);
            if (result.error) toast.error(result.error);
            else {
              toast.success(t("eventRejectedToast"));
              router.refresh();
            }
          })
        }
      >
        <X className="size-4" /> {t("reject")}
      </Button>
    </div>
  );
}
