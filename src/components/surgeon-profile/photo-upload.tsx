"use client";

import { Upload } from "lucide-react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { useRef, useState, useTransition } from "react";
import { toast } from "sonner";

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { uploadSurgeonPhotoAction } from "@/lib/actions/surgeon";
import { PHOTO_ALLOWED_TYPES, PHOTO_MAX_BYTES } from "@/lib/validation/surgeon";

export function PhotoUpload({
  surgeonId,
  hasPhoto,
  fullName,
  action,
}: {
  surgeonId: string;
  hasPhoto: boolean;
  fullName: string;
  /**
   * Defaults to the surgeon uploading their own photo. The admin edit page
   * passes adminUploadSurgeonPhotoAction.bind(null, locale, surgeon.id)
   * instead, since the default action always targets the signed-in user's
   * own profile — not whichever surgeon an admin happens to be editing.
   */
  action?: (formData: FormData) => Promise<{ error?: string; success?: boolean }>;
}) {
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations("photoUpload");
  const tActions = useTranslations("surgeonActions");
  const inputRef = useRef<HTMLInputElement>(null);
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [cacheBust, setCacheBust] = useState(0);

  const uploadAction = action ?? ((formData: FormData) => uploadSurgeonPhotoAction(locale, formData));

  const photoUrl = hasPhoto ? `/api/surgeon-photo/${surgeonId}?v=${cacheBust}` : undefined;
  const initials = fullName
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0])
    .join("")
    .toUpperCase();

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(null);

    if (!PHOTO_ALLOWED_TYPES.includes(file.type as (typeof PHOTO_ALLOWED_TYPES)[number])) {
      setError(tActions("onlyImageTypes"));
      return;
    }
    if (file.size > PHOTO_MAX_BYTES) {
      setError(tActions("imageTooLarge"));
      return;
    }

    const formData = new FormData();
    formData.set("photo", file);

    startTransition(async () => {
      const result = await uploadAction(formData);
      if (result.error) {
        setError(result.error);
        return;
      }
      setCacheBust((v) => v + 1);
      toast.success(tActions("photoUpdatedToast"));
      router.refresh();
    });
  }

  return (
    <div className="flex items-center gap-4">
      <Avatar className="size-20">
        <AvatarImage src={photoUrl} alt="" />
        <AvatarFallback className="text-lg">{initials}</AvatarFallback>
      </Avatar>
      <div>
        <input
          ref={inputRef}
          type="file"
          accept={PHOTO_ALLOWED_TYPES.join(",")}
          className="sr-only"
          onChange={handleFileChange}
        />
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={isPending}
          onClick={() => inputRef.current?.click()}
        >
          <Upload className="size-4" />
          {isPending ? t("uploading") : t("uploadPhoto")}
        </Button>
        <p className="mt-1 text-xs text-muted-foreground">{t("fileHint")}</p>
        {error && <p className="mt-1 text-xs text-destructive">{error}</p>}
      </div>
    </div>
  );
}
