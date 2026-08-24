import { CompassIcon } from "lucide-react";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";

import { Button } from "@/components/ui/button";

export default async function NotFound() {
  const t = await getTranslations("notFound");

  return (
    <div className="mx-auto flex min-h-[60vh] max-w-md flex-col items-center justify-center px-4 text-center">
      <CompassIcon className="size-10 text-muted-foreground" aria-hidden="true" />
      <h1 className="mt-4 font-heading text-2xl font-semibold text-foreground">
        {t("heading")}
      </h1>
      <p className="mt-2 text-muted-foreground">{t("body")}</p>
      <div className="mt-6 flex gap-3">
        <Button asChild>
          <Link href="/">{t("goHome")}</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/events">{t("viewEvents")}</Link>
        </Button>
      </div>
    </div>
  );
}
