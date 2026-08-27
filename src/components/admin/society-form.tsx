"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { useState } from "react";
import { useForm, type Resolver } from "react-hook-form";
import { toast } from "sonner";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { makeSocietySchema, SOCIETY_SPECIALTIES, type SocietyInput } from "@/lib/validation/society";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
const SITE_HOST = SITE_URL.replace(/^https?:\/\//, "");

export function SocietyForm({
  defaultValues,
  action,
}: {
  defaultValues: SocietyInput;
  action: (values: SocietyInput) => Promise<{ error?: string; success?: boolean }>;
}) {
  const router = useRouter();
  const [customSpecialty, setCustomSpecialty] = useState("");
  const [serverError, setServerError] = useState<string | null>(null);
  const t = useTranslations("societyForm");
  const tValidation = useTranslations("societyValidation");

  const form = useForm<SocietyInput>({
    resolver: zodResolver(makeSocietySchema(tValidation)) as Resolver<SocietyInput>,
    defaultValues,
  });
  const specialties = form.watch("specialties");

  function toggleSpecialty(specialty: string, checked: boolean) {
    const current = form.getValues("specialties");
    form.setValue(
      "specialties",
      checked ? [...current, specialty] : current.filter((s) => s !== specialty),
      { shouldValidate: true },
    );
  }

  function addCustomSpecialty() {
    const specialty = customSpecialty.trim();
    if (!specialty) return;
    const current = form.getValues("specialties");
    if (!current.includes(specialty)) {
      form.setValue("specialties", [...current, specialty], { shouldValidate: true });
    }
    setCustomSpecialty("");
  }

  async function onSubmit(values: SocietyInput) {
    setServerError(null);
    const result = await action(values);
    if (result.error) {
      setServerError(result.error);
      return;
    }
    toast.success(t("savedToast"));
    router.push("/admin/scientific-societies");
    router.refresh();
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8" noValidate>
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="name">{t("nameLabel")}</Label>
          <Input id="name" {...form.register("name")} />
          {form.formState.errors.name && (
            <p className="text-xs text-destructive">{form.formState.errors.name.message}</p>
          )}
        </div>
        {!!defaultValues.slug && (
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="slug">{t("permalinkLabel")}</Label>
            <div className="flex items-center gap-1 rounded-lg border border-input bg-transparent pl-2.5 has-[[aria-invalid=true]]:border-destructive has-[[aria-invalid=true]]:ring-3 has-[[aria-invalid=true]]:ring-destructive/20">
              <span className="shrink-0 text-sm text-muted-foreground">{SITE_HOST}/societies/</span>
              <Input
                id="slug"
                className="border-0 pl-0 focus-visible:ring-0"
                aria-invalid={!!form.formState.errors.slug}
                {...form.register("slug")}
              />
            </div>
            <p className="text-xs text-muted-foreground">{t("permalinkHint")}</p>
            {form.formState.errors.slug && (
              <p className="text-xs text-destructive">{form.formState.errors.slug.message}</p>
            )}
          </div>
        )}
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="description">{t("descriptionLabel")}</Label>
          <Textarea id="description" rows={10} {...form.register("description")} />
          {form.formState.errors.description && (
            <p className="text-xs text-destructive">{form.formState.errors.description.message}</p>
          )}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="country">{t("countryLabel")}</Label>
          <Input id="country" placeholder={t("countryPlaceholder")} {...form.register("country")} />
          {form.formState.errors.country && (
            <p className="text-xs text-destructive">{form.formState.errors.country.message}</p>
          )}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="websiteUrl">{t("websiteUrlLabel")}</Label>
          <Input id="websiteUrl" placeholder="https://" {...form.register("websiteUrl")} />
          {form.formState.errors.websiteUrl && (
            <p className="text-xs text-destructive">{form.formState.errors.websiteUrl.message}</p>
          )}
        </div>
      </section>

      <section className="space-y-3">
        <Label>{t("specialtiesLabel")}</Label>
        <div className="flex flex-wrap gap-x-4 gap-y-2">
          {SOCIETY_SPECIALTIES.map((specialty) => (
            <label key={specialty} className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={specialties.includes(specialty)}
                onCheckedChange={(checked) => toggleSpecialty(specialty, checked === true)}
              />
              {specialty}
            </label>
          ))}
        </div>
        <div className="flex gap-2">
          <Input
            placeholder={t("addSpecialtyPlaceholder")}
            value={customSpecialty}
            onChange={(e) => setCustomSpecialty(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addCustomSpecialty();
              }
            }}
          />
          <Button type="button" variant="outline" onClick={addCustomSpecialty}>
            <Plus className="size-4" /> {t("add")}
          </Button>
        </div>
        {form.formState.errors.specialties && (
          <p className="text-xs text-destructive">{form.formState.errors.specialties.message}</p>
        )}
      </section>

      {serverError && (
        <Alert variant="destructive">
          <AlertCircle className="size-4" />
          <AlertDescription>{serverError}</AlertDescription>
        </Alert>
      )}

      <Button type="submit" size="lg" disabled={form.formState.isSubmitting}>
        {form.formState.isSubmitting ? t("saving") : t("saveSociety")}
      </Button>
    </form>
  );
}
