"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, Plus, Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
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
import { saveSurgeonProfileAction } from "@/lib/actions/surgeon";
import { PRIMARY_SPECIALTY_LABELS } from "@/lib/format";
import {
  CONSULTATION_FORMATS,
  LANGUAGE_OPTIONS,
  PRIMARY_SPECIALTIES,
  SUGGESTED_SUBSPECIALTIES,
  surgeonProfileSchema,
  type SurgeonProfileFormValues,
} from "@/lib/validation/surgeon";
import { LATAM_COUNTRIES } from "@/lib/validation/event";

const CONSULTATION_FORMAT_OPTIONS: Record<(typeof CONSULTATION_FORMATS)[number], string> = {
  in_person: "Solo presencial",
  telemedicine: "Solo telemedicina",
  both: "Presencial y telemedicina",
};

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
  action = saveSurgeonProfileAction,
}: {
  defaultValues: SurgeonProfileFormValues;
  onSaved?: () => void;
  action?: (values: SurgeonProfileFormValues) => Promise<{ error?: string; success?: boolean }>;
}) {
  const router = useRouter();
  const [customTag, setCustomTag] = useState("");
  const [serverError, setServerError] = useState<string | null>(null);

  const form = useForm<SurgeonProfileFormValues>({
    resolver: zodResolver(surgeonProfileSchema) as Resolver<SurgeonProfileFormValues>,
    defaultValues,
  });

  const { fields, append, remove } = useFieldArray({ control: form.control, name: "locations" });
  const subspecialties = form.watch("subspecialties");
  const languages = form.watch("languages");
  const bio = form.watch("bio");

  function toggleSubspecialty(tag: string, checked: boolean) {
    const current = form.getValues("subspecialties");
    form.setValue(
      "subspecialties",
      checked ? [...current, tag] : current.filter((t) => t !== tag),
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
    toast.success("Perfil guardado");
    router.refresh();
    onSaved?.();
  }

  function onInvalid() {
    // react-hook-form blocks the submit silently otherwise, so the only
    // sign anything went wrong is a small red line under one of the many
    // fields — easy to miss, which reads as "guardar no hace nada".
    toast.error("Revisá los campos marcados en rojo antes de guardar.");
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
        <h2 className="font-heading text-lg font-semibold text-foreground">Datos básicos</h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="fullName">Nombre completo</Label>
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
              <Label htmlFor="slug">Dirección del perfil (permalink)</Label>
              <div className="flex items-center gap-1 rounded-lg border border-input bg-transparent pl-2.5 has-[[aria-invalid=true]]:border-destructive has-[[aria-invalid=true]]:ring-3 has-[[aria-invalid=true]]:ring-destructive/20">
                <span className="shrink-0 text-sm text-muted-foreground">{SITE_HOST}/surgeons/</span>
                <Input
                  id="slug"
                  className="border-0 pl-0 focus-visible:ring-0"
                  aria-invalid={!!form.formState.errors.slug}
                  {...form.register("slug")}
                />
              </div>
              <p className="text-xs text-muted-foreground">
                Si la cambiás, el enlace anterior deja de funcionar. Usá solo minúsculas, números
                y guiones.
              </p>
              {form.formState.errors.slug && (
                <p className="text-xs text-destructive">{form.formState.errors.slug.message}</p>
              )}
            </div>
          )}
          <div className="space-y-1.5">
            <Label htmlFor="professionalTitle">Título profesional</Label>
            <Input
              id="professionalTitle"
              placeholder="ej. Traumatólogo especialista en columna"
              aria-invalid={!!form.formState.errors.professionalTitle}
              {...form.register("professionalTitle")}
            />
            {form.formState.errors.professionalTitle && (
              <p className="text-xs text-destructive">
                {form.formState.errors.professionalTitle.message}
              </p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="primarySpecialty">Especialidad principal</Label>
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
                <SelectValue placeholder="Seleccioná una especialidad" />
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
            <Label htmlFor="yearsExperience">Años de experiencia</Label>
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
          <Label htmlFor="bio">Biografía</Label>
          <Textarea
            id="bio"
            rows={6}
            aria-invalid={!!form.formState.errors.bio}
            {...form.register("bio")}
          />
          <p className="text-xs text-muted-foreground">
            {bio?.length ?? 0}/4000 caracteres · mínimo 50
          </p>
          {form.formState.errors.bio && (
            <p className="text-xs text-destructive">{form.formState.errors.bio.message}</p>
          )}
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="font-heading text-lg font-semibold text-foreground">
          Afiliación y credenciales
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="hospitalAffiliation">Hospital / clínica</Label>
            <Input
              id="hospitalAffiliation"
              aria-invalid={!!form.formState.errors.hospitalAffiliation}
              {...form.register("hospitalAffiliation")}
            />
            {form.formState.errors.hospitalAffiliation && (
              <p className="text-xs text-destructive">
                {form.formState.errors.hospitalAffiliation.message}
              </p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="medicalLicenseNumber">Número de matrícula</Label>
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
            <Label htmlFor="medicalLicenseCountry">País de la matrícula</Label>
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
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="font-heading text-lg font-semibold text-foreground">Subespecialidades</h2>
        <div className="flex flex-wrap gap-x-4 gap-y-2">
          {SUGGESTED_SUBSPECIALTIES.map((tag) => (
            <label key={tag} className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={subspecialties.includes(tag)}
                onCheckedChange={(checked) => toggleSubspecialty(tag, checked === true)}
              />
              {tag}
            </label>
          ))}
        </div>
        <div className="flex gap-2">
          <Input
            placeholder="Agregar otra subespecialidad…"
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
            <Plus className="size-4" /> Agregar
          </Button>
        </div>
        {form.formState.errors.subspecialties && (
          <p className="text-xs text-destructive">
            {arrayFieldErrorMessage(
              form.formState.errors.subspecialties,
              "Revisá las subespecialidades seleccionadas.",
            )}
          </p>
        )}
      </section>

      <section className="space-y-4">
        <h2 className="font-heading text-lg font-semibold text-foreground">Idiomas</h2>
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
            {arrayFieldErrorMessage(
              form.formState.errors.languages,
              "Revisá los idiomas seleccionados: alguno no es una opción válida.",
            )}
          </p>
        )}
      </section>

      <section className="space-y-4">
        <h2 className="font-heading text-lg font-semibold text-foreground">
          Modalidad de consulta
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
            Lugares de atención
          </h2>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => append({ country: "", city: "", isPrimary: fields.length === 0 })}
          >
            <Plus className="size-4" /> Agregar lugar
          </Button>
        </div>

        {fields.map((field, index) => (
          <div
            key={field.id}
            className="grid grid-cols-1 gap-3 rounded-lg border border-border p-4 sm:grid-cols-[1fr_1fr_auto_auto]"
          >
            <div className="space-y-1.5">
              <Label>País</Label>
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
                  <SelectValue placeholder="Seleccioná el país" />
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
              <Label>Ciudad</Label>
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
              Principal
            </label>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="self-end text-destructive"
              onClick={() => remove(index)}
              aria-label="Quitar lugar"
            >
              <Trash2 className="size-4" />
            </Button>
          </div>
        ))}
        {form.formState.errors.locations && (
          <p className="text-xs text-destructive">
            {form.formState.errors.locations.message ?? "Revisá tus lugares de atención."}
          </p>
        )}
      </section>

      <section className="space-y-4">
        <h2 className="font-heading text-lg font-semibold text-foreground">
          Contacto y enlaces
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="websiteUrl">Sitio web profesional</Label>
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
            <Label htmlFor="contactEmail">Email de contacto público</Label>
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
            <Label htmlFor="contactPhone">Teléfono de contacto público</Label>
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

      {serverError && (
        <Alert variant="destructive">
          <AlertCircle className="size-4" />
          <AlertDescription>{serverError}</AlertDescription>
        </Alert>
      )}

      <Button type="submit" disabled={form.formState.isSubmitting} size="lg">
        {form.formState.isSubmitting ? "Guardando…" : "Guardar perfil"}
      </Button>
    </form>
  );
}
