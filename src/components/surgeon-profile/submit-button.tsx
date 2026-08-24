"use client";

import { Send } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { useState, useTransition } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { submitSurgeonProfileAction } from "@/lib/actions/surgeon";

export function SubmitButton() {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations("dashboard");
  const tActions = useTranslations("surgeonActions");
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
            const result = await submitSurgeonProfileAction(locale);
            if (result.error) {
              setError(result.error);
              return;
            }
            toast.success(tActions("profileSubmittedToast"));
            router.refresh();
          })
        }
      >
        <Send className="size-4" />
        {isPending ? t("submitting") : t("submitForReview")}
      </Button>
      {error && <p className="mt-2 text-sm text-destructive">{error}</p>}
    </div>
  );
}
