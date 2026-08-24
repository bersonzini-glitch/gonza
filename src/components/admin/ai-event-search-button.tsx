"use client";

import { Sparkles } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { triggerAiEventSearchAction } from "@/lib/actions/admin";

export function AiEventSearchButton() {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations("adminEventsPage");
  const [isPending, startTransition] = useTransition();

  return (
    <Button
      type="button"
      variant="outline"
      disabled={isPending}
      onClick={() =>
        startTransition(async () => {
          const result = await triggerAiEventSearchAction(locale);
          if (result.error) {
            toast.error(result.error);
            return;
          }
          toast.success(t("aiSearchStartedToast"));
          router.refresh();
        })
      }
    >
      <Sparkles className="size-4" /> {isPending ? t("aiSearchStarting") : t("aiSearchButton")}
    </Button>
  );
}
