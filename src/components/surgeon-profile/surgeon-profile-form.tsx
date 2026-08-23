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
  in_person: "In-person only",
  telemedicine: "Telemedicine only",
  both: "In-person & telemedicine",
};

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
    toast.success("Profile saved");
    router.refresh();
    onSaved?.();
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8" noValidate>
      <section className="space-y-4">
        <h2 className="font-heading text-lg font-semibold text-foreground">Basics</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="fullName">Full name</Label>
            <Input id="fullName" {...form.register("fullName")} />
            {form.formState.errors.fullName && (
              <p className="text-xs text-destructive">{form.formState.errors.fullName.message}</p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="professionalTitle">Professional title</Label>
            <Input
              id="professionalTitle"
              placeholder="e.g. Orthopedic Spine Surgeon, MD"
              {...form.register("professionalTitle")}
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="primarySpecialty">Primary specialty</Label>
            <Select
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
              <SelectTrigger id="primarySpecialty" className="w-full">
                <SelectValue placeholder="Select a specialty" />
              </SelectTrigger>
              <SelectContent>
                {PRIMARY_SPECIALTIES.map((s) => (
                  <SelectItem key={s} value={s}>
                    {PRIMARY_SPECIALTY_LABELS[s]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="yearsExperience">Years of experience</Label>
            <Input
              id="yearsExperience"
              type="number"
              min={0}
              max={70}
              {...form.register("yearsExperience")}
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="bio">Biography</Label>
          <Textarea id="bio" rows={6} {...form.register("bio")} />
          {form.formState.errors.bio && (
            <p className="text-xs text-destructive">{form.formState.errors.bio.message}</p>
          )}
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="font-heading text-lg font-semibold text-foreground">
          Affiliation & credentials
        </h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="hospitalAffiliation">Hospital / clinic</Label>
            <Input id="hospitalAffiliation" {...form.register("hospitalAffiliation")} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="medicalLicenseNumber">Medical registration number</Label>
            <Input id="medicalLicenseNumber" {...form.register("medicalLicenseNumber")} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="medicalLicenseCountry">Registration country</Label>
            <Input id="medicalLicenseCountry" {...form.register("medicalLicenseCountry")} />
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <h2 className="font-heading text-lg font-semibold text-foreground">Subspecialties</h2>
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
            placeholder="Add another subspecialty…"
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
            <Plus className="size-4" /> Add
          </Button>
        </div>
        {form.formState.errors.subspecialties && (
          <p className="text-xs text-destructive">{form.formState.errors.subspecialties.message}</p>
        )}
      </section>

      <section className="space-y-4">
        <h2 className="font-heading text-lg font-semibold text-foreground">Languages</h2>
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
          <p className="text-xs text-destructive">{form.formState.errors.languages.message}</p>
        )}
      </section>

      <section className="space-y-4">
        <h2 className="font-heading text-lg font-semibold text-foreground">Consultation format</h2>
        <Select
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
          <SelectTrigger className="w-full sm:w-72">
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
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-heading text-lg font-semibold text-foreground">Practice locations</h2>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => append({ country: "", city: "", isPrimary: fields.length === 0 })}
          >
            <Plus className="size-4" /> Add location
          </Button>
        </div>

        {fields.map((field, index) => (
          <div
            key={field.id}
            className="grid gap-3 rounded-lg border border-border p-4 sm:grid-cols-[1fr_1fr_auto_auto]"
          >
            <div className="space-y-1.5">
              <Label>Country</Label>
              <Select
                value={form.watch(`locations.${index}.country`)}
                onValueChange={(v) =>
                  form.setValue(`locations.${index}.country`, v ?? "", { shouldValidate: true })
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select country" />
                </SelectTrigger>
                <SelectContent>
                  {LATAM_COUNTRIES.map((c) => (
                    <SelectItem key={c} value={c}>
                      {c}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label>City</Label>
              <Input {...form.register(`locations.${index}.city`)} />
            </div>
            <label className="flex items-center gap-2 self-end pb-2 text-sm">
              <Checkbox
                checked={form.watch(`locations.${index}.isPrimary`)}
                onCheckedChange={(checked) =>
                  form.setValue(`locations.${index}.isPrimary`, checked === true)
                }
              />
              Primary
            </label>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="self-end text-destructive"
              onClick={() => remove(index)}
              aria-label="Remove location"
            >
              <Trash2 className="size-4" />
            </Button>
          </div>
        ))}
        {form.formState.errors.locations && (
          <p className="text-xs text-destructive">
            {form.formState.errors.locations.message ?? "Check your locations."}
          </p>
        )}
      </section>

      <section className="space-y-4">
        <h2 className="font-heading text-lg font-semibold text-foreground">Contact & links</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="websiteUrl">Professional website</Label>
            <Input id="websiteUrl" placeholder="https://" {...form.register("websiteUrl")} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="contactEmail">Public contact email</Label>
            <Input id="contactEmail" type="email" {...form.register("contactEmail")} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="contactPhone">Public contact phone</Label>
            <Input id="contactPhone" {...form.register("contactPhone")} />
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
        {form.formState.isSubmitting ? "Saving…" : "Save profile"}
      </Button>
    </form>
  );
}
