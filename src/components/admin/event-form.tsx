"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { AlertCircle, Plus, Trash2 } from "lucide-react";
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
import { EVENT_FORMAT_LABELS, EVENT_TYPE_LABELS } from "@/lib/format";
import {
  EVENT_FORMATS,
  EVENT_SOURCE_TYPES,
  EVENT_STATUSES,
  EVENT_TOPICS,
  EVENT_TYPES,
  LATAM_COUNTRIES,
  eventSchema,
  type EventInput,
} from "@/lib/validation/event";

const SOURCE_TYPE_LABELS: Record<(typeof EVENT_SOURCE_TYPES)[number], string> = {
  official_society: "Sociedad oficial",
  hospital: "Hospital",
  university: "Universidad",
  organizer: "Organizador del evento",
  rss: "Feed RSS público",
  public_api: "API abierta/pública",
  other: "Otro",
};

const EVENT_STATUS_LABELS: Record<(typeof EVENT_STATUSES)[number], string> = {
  pending: "Pendiente",
  approved: "Aprobado",
  rejected: "Rechazado",
};

// Base UI's <Select.Value> only resolves a label for the current value from
// an explicit `items` map passed to <Select.Root> — without it, it falls
// back to showing the raw stored value (e.g. the enum key itself).
const COUNTRY_ITEMS: Record<string, string> = Object.fromEntries(
  LATAM_COUNTRIES.map((c) => [c, c]),
);

export function EventForm({
  defaultValues,
  action,
}: {
  defaultValues: EventInput;
  action: (values: EventInput) => Promise<{ error?: string; success?: boolean }>;
}) {
  const router = useRouter();
  const [customTopic, setCustomTopic] = useState("");
  const [serverError, setServerError] = useState<string | null>(null);

  const form = useForm<EventInput>({
    resolver: zodResolver(eventSchema) as Resolver<EventInput>,
    defaultValues,
  });
  const { fields, append, remove } = useFieldArray({ control: form.control, name: "sources" });
  const topics = form.watch("topics");

  function toggleTopic(topic: string, checked: boolean) {
    const current = form.getValues("topics");
    form.setValue("topics", checked ? [...current, topic] : current.filter((t) => t !== topic), {
      shouldValidate: true,
    });
  }

  function addCustomTopic() {
    const topic = customTopic.trim();
    if (!topic) return;
    const current = form.getValues("topics");
    if (!current.includes(topic)) {
      form.setValue("topics", [...current, topic], { shouldValidate: true });
    }
    setCustomTopic("");
  }

  async function onSubmit(values: EventInput) {
    setServerError(null);
    const result = await action(values);
    if (result.error) {
      setServerError(result.error);
      return;
    }
    toast.success("Guardado");
    router.push("/admin/events");
    router.refresh();
  }

  return (
    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8" noValidate>
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="title">Título</Label>
          <Input id="title" {...form.register("title")} />
          {form.formState.errors.title && (
            <p className="text-xs text-destructive">{form.formState.errors.title.message}</p>
          )}
        </div>
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="description">Descripción</Label>
          <Textarea id="description" rows={5} {...form.register("description")} />
          {form.formState.errors.description && (
            <p className="text-xs text-destructive">{form.formState.errors.description.message}</p>
          )}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="organizer">Organizador</Label>
          <Input id="organizer" {...form.register("organizer")} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="eventType">Tipo de evento</Label>
          <Select
            items={EVENT_TYPE_LABELS}
            value={form.watch("eventType")}
            onValueChange={(v) =>
              form.setValue("eventType", v as EventInput["eventType"], { shouldValidate: true })
            }
          >
            <SelectTrigger id="eventType" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {EVENT_TYPES.map((t) => (
                <SelectItem key={t} value={t}>
                  {EVENT_TYPE_LABELS[t]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="format">Modalidad</Label>
          <Select
            items={EVENT_FORMAT_LABELS}
            value={form.watch("format")}
            onValueChange={(v) =>
              form.setValue("format", v as EventInput["format"], { shouldValidate: true })
            }
          >
            <SelectTrigger id="format" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {EVENT_FORMATS.map((f) => (
                <SelectItem key={f} value={f}>
                  {EVENT_FORMAT_LABELS[f]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="status">Estado</Label>
          <Select
            items={EVENT_STATUS_LABELS}
            value={form.watch("status")}
            onValueChange={(v) =>
              form.setValue("status", v as EventInput["status"], { shouldValidate: true })
            }
          >
            <SelectTrigger id="status" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {EVENT_STATUSES.map((s) => (
                <SelectItem key={s} value={s}>
                  {EVENT_STATUS_LABELS[s]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <label className="flex items-center gap-2 self-end pb-2 text-sm">
          <Checkbox
            checked={form.watch("isFeatured")}
            onCheckedChange={(checked) => form.setValue("isFeatured", checked === true)}
          />
          Destacado en la página de inicio
        </label>
      </section>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="space-y-1.5">
          <Label htmlFor="startDate">Fecha de inicio</Label>
          <Input id="startDate" type="date" {...form.register("startDate")} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="endDate">Fecha de fin</Label>
          <Input id="endDate" type="date" {...form.register("endDate")} />
          {form.formState.errors.endDate && (
            <p className="text-xs text-destructive">{form.formState.errors.endDate.message}</p>
          )}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="timezone">Zona horaria</Label>
          <Input id="timezone" placeholder="America/Sao_Paulo" {...form.register("timezone")} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="startTime">Hora de inicio (opcional)</Label>
          <Input id="startTime" type="time" {...form.register("startTime")} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="endTime">Hora de fin (opcional)</Label>
          <Input id="endTime" type="time" {...form.register("endTime")} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="dateNote">Nota de fecha (opcional)</Label>
          <Input
            id="dateNote"
            placeholder="Curso anual, fechas exactas por confirmar"
            {...form.register("dateNote")}
          />
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="space-y-1.5">
          <Label htmlFor="country">País</Label>
          <Select
            items={COUNTRY_ITEMS}
            value={form.watch("country")}
            onValueChange={(v) => form.setValue("country", v ?? "", { shouldValidate: true })}
          >
            <SelectTrigger id="country" className="w-full">
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
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="city">Ciudad</Label>
          <Input id="city" {...form.register("city")} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="venue">Sede</Label>
          <Input id="venue" {...form.register("venue")} />
        </div>
      </section>

      <section className="space-y-3">
        <Label>Temas</Label>
        <div className="flex flex-wrap gap-x-4 gap-y-2">
          {EVENT_TOPICS.map((topic) => (
            <label key={topic} className="flex items-center gap-2 text-sm">
              <Checkbox
                checked={topics.includes(topic)}
                onCheckedChange={(checked) => toggleTopic(topic, checked === true)}
              />
              {topic}
            </label>
          ))}
        </div>
        <div className="flex gap-2">
          <Input
            placeholder="Agregar otro tema…"
            value={customTopic}
            onChange={(e) => setCustomTopic(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                addCustomTopic();
              }
            }}
          />
          <Button type="button" variant="outline" onClick={addCustomTopic}>
            <Plus className="size-4" /> Agregar
          </Button>
        </div>
        {form.formState.errors.topics && (
          <p className="text-xs text-destructive">{form.formState.errors.topics.message}</p>
        )}
      </section>

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="officialUrl">URL del sitio oficial</Label>
          <Input id="officialUrl" placeholder="https://" {...form.register("officialUrl")} />
          {form.formState.errors.officialUrl && (
            <p className="text-xs text-destructive">{form.formState.errors.officialUrl.message}</p>
          )}
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="registrationUrl">URL de inscripción (opcional)</Label>
          <Input
            id="registrationUrl"
            placeholder="https://"
            {...form.register("registrationUrl")}
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="sourceUrl">URL de la fuente principal</Label>
          <Input id="sourceUrl" placeholder="https://" {...form.register("sourceUrl")} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="lastVerifiedAt">Última verificación</Label>
          <Input id="lastVerifiedAt" type="date" {...form.register("lastVerifiedAt")} />
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <Label>Fuentes de datos</Label>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              append({ sourceName: "", sourceUrl: "", sourceType: "official_society", notes: "" })
            }
          >
            <Plus className="size-4" /> Agregar fuente
          </Button>
        </div>
        {fields.map((field, index) => (
          <div
            key={field.id}
            className="grid grid-cols-1 gap-3 rounded-lg border border-border p-4 sm:grid-cols-[1fr_1fr_1fr_auto]"
          >
            <div className="space-y-1.5">
              <Label>Nombre de la fuente</Label>
              <Input {...form.register(`sources.${index}.sourceName`)} />
            </div>
            <div className="space-y-1.5">
              <Label>URL de la fuente</Label>
              <Input {...form.register(`sources.${index}.sourceUrl`)} />
            </div>
            <div className="space-y-1.5">
              <Label>Tipo</Label>
              <Select
                items={SOURCE_TYPE_LABELS}
                value={form.watch(`sources.${index}.sourceType`)}
                onValueChange={(v) =>
                  form.setValue(
                    `sources.${index}.sourceType`,
                    v as EventInput["sources"][number]["sourceType"],
                  )
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {EVENT_SOURCE_TYPES.map((t) => (
                    <SelectItem key={t} value={t}>
                      {SOURCE_TYPE_LABELS[t]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="self-end text-destructive"
              onClick={() => remove(index)}
              aria-label="Quitar fuente"
            >
              <Trash2 className="size-4" />
            </Button>
          </div>
        ))}
        {form.formState.errors.sources && (
          <p className="text-xs text-destructive">
            {form.formState.errors.sources.message ?? "Revisá tus fuentes de datos."}
          </p>
        )}
      </section>

      {serverError && (
        <Alert variant="destructive">
          <AlertCircle className="size-4" />
          <AlertDescription>{serverError}</AlertDescription>
        </Alert>
      )}

      <Button type="submit" size="lg" disabled={form.formState.isSubmitting}>
        {form.formState.isSubmitting ? "Guardando…" : "Guardar evento"}
      </Button>
    </form>
  );
}
