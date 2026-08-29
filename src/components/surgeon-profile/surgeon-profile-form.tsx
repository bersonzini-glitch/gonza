"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, Plus, Trash2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { useState } from "react";
import { useFieldArray, useForm, type Resolver } from "react-hook-form";
import { toast } from "sonner";

import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { consultationFormatLabels, primarySpecialtyLabels, subspecialtyLabels } from "@/lib/format";
import {
  CONSULTATION_FORMATS,
  LANGUAGE_OPTIONS,
  PRIMARY_SPECIALTIES,
  SUGGESTED_SUBSPECIALTIES,
  makeSurgeonProfileSchema,
  type SurgeonProfileFormValues,
} from "@/lib/validation/surgeon";
import { LATAM_COUNTRIES } from "@/lib/validation/event";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
const SITE_HOST = SITE_URL.replace(/^https?:\/\//, "");

// Base UI's <Select.Value> only resolves a label for the current value from
// an explicit `items` map passed to <Select.Root> — without it, it falls
// back to showing the raw stored value (e.g. the enum key itself).
const COUNTRY_ITEMS: Record<string, string> = Object.fromEntries(
  LATAM_COUNTRIES.map((c) => [c, c]),
);

export function SurgeonProfileForm({
  defaultValues,
  onSaved,
  action,
  awaitingFirstSubmission = false,
  showNotificationPreferences = true,
}: {
  defaultValues: SurgeonProfileFormValues;
  onSaved?: () => void;
  action: (values: SurgeonProfileFormValues) => Promise<{ error?: string; success?: boolean }>;
  /**
   * True while the profile hasn't been sent for review yet (no profile
   * saved yet, still a draft, or kicked back as rejected) — the save
   * button says so explicitly, so a surgeon filling this in for the first
   * time understands saving isn't the last step; submitting for review is
   * separate. Not set from the admin edit form, where this two-step framing
   * doesn't apply.
   */
  awaitingFirstSubmission?: boolean;
  /**
   * These two fields are a personal communication preference stored on
   * `profiles`, not profile content — shown on the surgeon's own dashboard,
   * but hidden on the admin review form, which only ever writes to
   * `surgeon_profiles` and has no business changing what a surgeon opted
   * into.
   */
  showNotificationPreferences?: boolean;
}) {
  const router = useRouter();
  const [customTag, setCustomTag] = useState("");
  const [serverError, setServerError] = useState<string | null>(null);
  const t = useTranslations("surgeonForm");
  const tValidation = useTranslations("surgeonValidation");
  const tSpecialties = useTranslations("specialties");
  const tConsultationFormats = useTranslations("consultationFormats");
  const tSubspecialties = useTranslations("subspecialties");
  const PRIMARY_SPECIALTY_LABELS = primarySpecialtyLabels(tSpecialties);
  const CONSULTATION_FORMAT_OPTIONS = consultationFormatLabels(tConsultationFormats);
  const SUBSPECIALTY_LABELS = subspecialtyLabels(tSubspecialties);

  const form = useForm<SurgeonProfileFormValues>({
    resolver: zodResolver(makeSurgeonProfileSchema(tValidation)) as Resolver<SurgeonProfileFormValues>,
    defaultValues,
  });

  const { fields, append, remove } = useFieldArray({ control: form.control, name: "locations" });
  const subspecialties = form.watch("subspecialties");
  const languages = form.watch("languages");
  const bio = form.watch("bio");
  const hospitalAffiliations = form.watch("hospitalAffiliations") ?? [];

  function addHospital() {
    form.setValue("hospitalAffiliations", [...hospitalAffiliations, ""], {
      shouldValidate: true,
    });
  }

  function updateHospital(index: number, value: string) {
    const current = [...(form.getValues("hospitalAffiliations") ?? [])];
    current[index] = value;
    form.setValue("hospitalAffiliations", current, { shouldValidate: true });
  }

  function removeHospital(index: number) {
    const current = [...(form.getValues("hospitalAffiliations") ?? [])];
    current.splice(index, 1);
    form.setValue("hospitalAffiliations", current, { shouldValidate: true });
  }

  function toggleSubspecialty(tag: string, checked: boolean) {
    const current = form.getValues("subspecialties");
    form.setValue(
      "subspecialties",
      checked ? [...current, tag] : current.filter((s) => s !== tag),
      { shouldValidate: true },
    );
  }

  function toggleLanguage(lang: (typeof LANGUAGE_OPTIONS)[number], checked: boolean) {
    const current = form.getValues("languages");
    form.setValue("languages", checked ? [...current, lang] : current.filter((l) => l !== lang), {
      shouldValidate: true,
    });
  }

  function addCustomTag() {
    const tag = customTag.trim();
    if (!tag) return;
    const current = form.getValues("subspecialties");
    if (!current.includes(tag)) {
      form.setValue("subspecialties", [...current, tag], { shouldValidate: true });
    }
    setCustomTag("");
  }

  async function onSubmit(values: SurgeonProfileFormValues) {
    setServerError(null);
    const result = await action(values);
    if (result.error) {
      setServerError(result.error);
      return;
    }
    toast.success(t("profileSavedToast"));
    router.refresh();
    onSaved?.();
  }

  function onInvalid() {
    // react-hook-form blocks the submit silently otherwise, so the only
    // sign anything went wrong is a small red line under one of the many
    // fields — easy to miss, which reads as "guardar no hace nada".
    toast.error(t("invalidFieldsToast"));
  }

  // For an array field (e.g. an enum array), RHF/zod reports either one
  // FieldError with a `.message`, or an array with one entry per item —
  // in that second shape `.message` is undefined on the array itself, so
  // this pulls the first real message out of either shape.
  function arrayFieldErrorMessage(error: unknown, fallback: string): string {
    if (!error || typeof error !== "object") return fallback;
    if ("message" in error && typeof error.message === "string" && error.message) {
      return error.message;
    }
    if (Array.isArray(error)) {
      for (const item of error) {
        if (item && typeof item === "object" && "message" in item && typeof item.message === "string") {
          return item.message;
        }
      }
    }
    return fallback;
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit, onInvalid)} className="space-y-8" noValidate>
      <section className="space-y-4">
        <h2 className="font-heading text-lg font-semibold text-foreground">
          {t("basicDataHeading")}
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="fullName">{t("fullName")}</Label>
            <Input
              id="fullName"
              aria-invalid={!!form.formState.errors.fullName}
              {...form.register("fullName")}
            />
            {form.formState.errors.fullName && (
              <p className="text-xs text-destructive">{form.formState.errors.fullName.message}</p>
            )}
          </div>
          {!!defaultValues.slug && (
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="slug">{t("profileUrlLabel")}</Label>
              <div className="flex items-center gap-1 rounded-lg border border-input bg-transparent pl-2.5 has-[[aria-invalid=true]]:border-destructive has-[[aria-invalid=true]]:ring-3 has-[[aria-invalid=true]]:ring-destructive/20">
                <span className="shrink-0 text-sm text-muted-foreground">{SITE_HOST}/surgeons/</span>
                <Input
                  id="slug"
                  className="border-0 pl-0 focus-visible:ring-0"
                  aria-invalid={!!form.formState.errors.slug}
                  {...form.register("slug")}
                />
              </div>
              <p className="text-xs text-muted-foreground">{t("profileUrlHint")}</p>
              {form.formState.errors.slug && (
                <p className="text-xs text-destructive">{form.formState.errors.slug.message}</p>
              )}
            </div>
          )}
          <div className="space-y-1.5">
            <Label htmlFor="primarySpecialty">{t("primarySpecialty")}</Label>
            <Select
              items={PRIMARY_SPECIALTY_LABELS}
              value={form.watch("primarySpecialty")}
              onValueChange={(v) =>
                form.setValue(
                  "primarySpecialty",
                  v as SurgeonProfileFormValues["primarySpecialty"],
                  {
                    shouldValidate: true,
                  },
                )
              }
            >
              <SelectTrigger
                id="primarySpecialty"
                className="w-full"
                aria-invalid={!!form.formState.errors.primarySpecialty}
              >
                <SelectValue placeholder={t("selectSpecialty")} />
              </SelectTrigger>
              <SelectContent>
                {PRIMARY_SPECIALTIES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {PRIMARY_SPECIALTY_LABELS[s]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {form.formState.errors.primarySpecialty && (
              <p className="text-xs text-destructive">
                {form.formState.errors.primarySpecialty.message}
              </p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="yearsExperience">{t("yearsExperience")}</Label>
            <Input
              id="yearsExperience"
              type="number"
              min={0}
              max={70}
              aria-invalid={!!form.formState.errors.yearsExperience}
              {...form.register("yearsExperience")}
            />
            {form.formState.errors.yearsExperience && (
              <p className="text-xs text-destructive">
                {form.formState.errors.yearsExperience.message}
              </p>
            )}
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="bio">{t("bio")}</Label>
          <Textarea
            id="bio"
            rows={6}
            aria-invalid={!!form.formState.errors.bio}
            {...form.register("bio")}
          />
          <p className="text-xs text-muted-foreground">
            {t("bioCounter", { count: bio?.length ?? 0 })}
          </p>
          {form.formState.errors.bio && (
            <p className="text-xs text-destructive">{form.formState.errors.bio.message}</p>
          )}
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="font-heading text-lg font-semibold text-foreground">
          {t("affiliationHeading")}
        </h2>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label>{t("hospitalsLabel")}</Label>
            <Button type="button" variant="outline" size="sm" onClick={addHospital}>
              <Plus className="size-4" /> {t("add")}
            </Button>
          </div>
          {hospitalAffiliations.length === 0 && (
            <p className="text-xs text-muted-foreground">{t("addHospitalHint")}</p>
          )}
          {hospitalAffiliations.map((value, index) => (
            <div key={index} className="flex items-center gap-2">
              <Input
                value={value}
                aria-invalid={!!form.formState.errors.hospitalAffiliations?.[index]}
                onChange={(e) => updateHospital(index, e.target.value)}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="shrink-0 text-destructive"
                onClick={() => removeHospital(index)}
                aria-label={t("removeHospital")}
              >
                <Trash2 className="size-4" />
              </Button>
            </div>
          ))}
          {form.formState.errors.hospitalAffiliations && (
            <p className="text-xs text-destructive">
              {arrayFieldErrorMessage(form.formState.errors.hospitalAffiliations, t("hospitalsError"))}
            </p>
          )}
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="medicalLicenseNumber">{t("licenseNumber")}</Label>
            <Input
              id="medicalLicenseNumber"
              aria-invalid={!!form.formState.errors.medicalLicenseNumber}
              {...form.register("medicalLicenseNumber")}
            />
            {form.formState.errors.medicalLicenseNumber && (
              <p className="text-xs text-destructive">
                {form.formState.errors.medicalLicenseNumber.message}
              </p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="medicalLicenseCountry">{t("licenseCountry")}</Label>
            <Input
              id="medicalLicenseCountry"
              aria-invalid={!!form.formState.errors.medicalLicenseCountry}
              {...form.register("medicalLicenseCountry")}
            />
            {form.formState.errors.medicalLicenseCountry && (
              <p className="text-xs text-destructive">
                {form.formState.errors.medicalLicenseCountry.message}
              </p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="specialistLicenseNumber">{t("specialistLicenseNumber")}</Label>
            <Input
              id="specialistLicenseNumber"
              aria-invalid={!!form.formState.errors.specialistLicenseNumber}
              {...form.register("specialistLicenseNumber")}
            />
            {form.formState.errors.specialistLicenseNumber && (
              <p className="text-xs text-destructive">
                {form.formState.errors.specialistLicenseNumber.message}
              </p>
            )}
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="font-heading text-lg font-semibold text-foreground">
          {t("subspecialtiesHeading")}
        </h2>
        <div className="flex flex-wrap gap-x-4 gap-y-2">
          {SUGGESTED_SUBSPECIALTIES.map((key) => (
            <label key={key} className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={subspecialties.includes(key)}
                onCheckedChange={(checked) => toggleSubspecialty(key, checked === true)}
              />
              {SUBSPECIALTY_LABELS[key]}
            </label>
          ))}
        </div>
        <div className="flex gap-2">
          <Input
            placeholder={t("addSubspecialtyPlaceholder")}
            value={customTag}
            onChange={(e) => setCustomTag(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addCustomTag();
              }
            }}
          />
          <Button type="button" variant="outline" onClick={addCustomTag}>
            <Plus className="size-4" /> {t("add")}
          </Button>
        </div>
        {form.formState.errors.subspecialties && (
          <p className="text-xs text-destructive">
            {arrayFieldErrorMessage(form.formState.errors.subspecialties, t("subspecialtiesError"))}
          </p>
        )}
      </section>

      <section className="space-y-4">
        <h2 className="font-heading text-lg font-semibold text-foreground">
          {t("languagesHeading")}
        </h2>
        <div className="flex flex-wrap gap-x-4 gap-y-2">
          {LANGUAGE_OPTIONS.map((lang) => (
            <label key={lang} className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={languages.includes(lang)}
                onCheckedChange={(checked) => toggleLanguage(lang, checked === true)}
              />
              {lang}
            </label>
          ))}
        </div>
        {form.formState.errors.languages && (
          <p className="text-xs text-destructive">
            {arrayFieldErrorMessage(form.formState.errors.languages, t("languagesError"))}
          </p>
        )}
      </section>

      <section className="space-y-4">
        <h2 className="font-heading text-lg font-semibold text-foreground">
          {t("consultationFormatHeading")}
        </h2>
        <Select
          items={CONSULTATION_FORMAT_OPTIONS}
          value={form.watch("consultationFormat")}
          onValueChange={(v) =>
            form.setValue(
              "consultationFormat",
              v as SurgeonProfileFormValues["consultationFormat"],
              {
                shouldValidate: true,
              },
            )
          }
        >
          <SelectTrigger
            className="w-full sm:w-72"
            aria-invalid={!!form.formState.errors.consultationFormat}
          >
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {CONSULTATION_FORMATS.map((f) => (
              <SelectItem key={f} value={f}>
                {CONSULTATION_FORMAT_OPTIONS[f]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {form.formState.errors.consultationFormat && (
          <p className="text-xs text-destructive">
            {form.formState.errors.consultationFormat.message}
          </p>
        )}
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-heading text-lg font-semibold text-foreground">
            {t("locationsHeading")}
          </h2>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => append({ country: "", city: "", isPrimary: fields.length === 0 })}
          >
            <Plus className="size-4" /> {t("addLocation")}
          </Button>
        </div>

        {fields.map((field, index) => (
          <div
            key={field.id}
            className="grid grid-cols-1 gap-3 rounded-lg border border-border p-4 sm:grid-cols-[1fr_1fr_auto_auto]"
          >
            <div className="space-y-1.5">
              <Label>{t("country")}</Label>
              <Select
                items={COUNTRY_ITEMS}
                value={form.watch(`locations.${index}.country`)}
                onValueChange={(v) =>
                  form.setValue(`locations.${index}.country`, v ?? "", { shouldValidate: true })
                }
              >
                <SelectTrigger
                  className="w-full"
                  aria-invalid={!!form.formState.errors.locations?.[index]?.country}
                >
                  <SelectValue placeholder={t("selectCountry")} />
                </SelectTrigger>
                <SelectContent>
                  {LATAM_COUNTRIES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {form.formState.errors.locations?.[index]?.country && (
                <p className="text-xs text-destructive">
                  {form.formState.errors.locations[index]?.country?.message}
                </p>
              )}
            </div>
            <div className="space-y-1.5">
              <Label>{t("city")}</Label>
              <Input
                aria-invalid={!!form.formState.errors.locations?.[index]?.city}
                {...form.register(`locations.${index}.city`)}
              />
              {form.formState.errors.locations?.[index]?.city && (
                <p className="text-xs text-destructive">
                  {form.formState.errors.locations[index]?.city?.message}
                </p>
              )}
            </div>
            <label className="flex items-center gap-2 self-end pb-2 text-sm">
              <Checkbox
                checked={form.watch(`locations.${index}.isPrimary`)}
                onCheckedChange={(checked) =>
                  form.setValue(`locations.${index}.isPrimary`, checked === true)
                }
              />
              {t("primary")}
            </label>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="self-end text-destructive"
              onClick={() => remove(index)}
              aria-label={t("removeLocation")}
            >
              <Trash2 className="size-4" />
            </Button>
          </div>
        ))}
        {form.formState.errors.locations && (
          <p className="text-xs text-destructive">
            {form.formState.errors.locations.message ?? t("locationsError")}
          </p>
        )}
      </section>

      <section className="space-y-4">
        <h2 className="font-heading text-lg font-semibold text-foreground">
          {t("contactHeading")}
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="websiteUrl">{t("websiteUrl")}</Label>
            <Input
              id="websiteUrl"
              placeholder="https://"
              aria-invalid={!!form.formState.errors.websiteUrl}
              {...form.register("websiteUrl")}
            />
            {form.formState.errors.websiteUrl && (
              <p className="text-xs text-destructive">
                {form.formState.errors.websiteUrl.message}
              </p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="instagramUrl">{t("instagram")}</Label>
            <Input
              id="instagramUrl"
              placeholder="https://instagram.com/…"
              aria-invalid={!!form.formState.errors.instagramUrl}
              {...form.register("instagramUrl")}
            />
            {form.formState.errors.instagramUrl && (
              <p className="text-xs text-destructive">
                {form.formState.errors.instagramUrl.message}
              </p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="linkedinUrl">{t("linkedin")}</Label>
            <Input
              id="linkedinUrl"
              placeholder="https://linkedin.com/in/…"
              aria-invalid={!!form.formState.errors.linkedinUrl}
              {...form.register("linkedinUrl")}
            />
            {form.formState.errors.linkedinUrl && (
              <p className="text-xs text-destructive">
                {form.formState.errors.linkedinUrl.message}
              </p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="contactEmail">{t("contactEmail")}</Label>
            <Input
              id="contactEmail"
              type="email"
              aria-invalid={!!form.formState.errors.contactEmail}
              {...form.register("contactEmail")}
            />
            {form.formState.errors.contactEmail && (
              <p className="text-xs text-destructive">
                {form.formState.errors.contactEmail.message}
              </p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="contactPhone">{t("contactPhone")}</Label>
            <Input
              id="contactPhone"
              aria-invalid={!!form.formState.errors.contactPhone}
              {...form.register("contactPhone")}
            />
            {form.formState.errors.contactPhone && (
              <p className="text-xs text-destructive">
                {form.formState.errors.contactPhone.message}
              </p>
            )}
          </div>
        </div>
      </section>

      {showNotificationPreferences && (
        <section className="space-y-3">
          <h2 className="font-heading text-lg font-semibold text-foreground">
            {t("notificationsHeading")}
          </h2>
          <label className="flex items-start gap-2 text-sm">
            <Checkbox
              checked={form.watch("notifyNewEvents")}
              onCheckedChange={(checked) => form.setValue("notifyNewEvents", checked === true)}
              className="mt-0.5"
            />
            {t("notifyNewEventsLabel")}
          </label>
          <label className="flex items-start gap-2 text-sm">
            <Checkbox
              checked={form.watch("notifySuggestedInvitations")}
              onCheckedChange={(checked) =>
                form.setValue("notifySuggestedInvitations", checked === true)
              }
              className="mt-0.5"
            />
            {t("notifySuggestedInvitationsLabel")}
          </label>
        </section>
      )}

      {serverError && (
        <Alert variant="destructive">
          <AlertCircle className="size-4" />
          <AlertDescription>{serverError}</AlertDescription>
        </Alert>
      )}

      <Button type="submit" disabled={form.formState.isSubmitting} size="lg">
        {form.formState.isSubmitting
          ? t("saving")
          : awaitingFirstSubmission
            ? t("saveProfileBeforeReview")
            : t("saveProfile")}
      </Button>
    </form>
  );
}
