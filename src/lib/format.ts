import type { useTranslations } from "next-intl";

import type {
  ConsultationFormat,
  EventFormat,
  EventType,
  PrimarySpecialty,
} from "@/types/database";
import { SUGGESTED_SUBSPECIALTIES, type SubspecialtyKey } from "@/lib/validation/surgeon";

// Each *Labels() function takes the translator for its message namespace
// and returns the same Record<Enum, string> shape the old hardcoded
// constants had, so call sites keep doing LABELS[key] unchanged — only
// the one line that builds LABELS (useTranslations/getTranslations +
// this call) is new.
type Translator<Ns extends string> = ReturnType<typeof useTranslations<Ns>>;

export function eventTypeLabels(t: Translator<"eventTypes">): Record<EventType, string> {
  return {
    congress: t("congress"),
    conference: t("conference"),
    course: t("course"),
    workshop: t("workshop"),
    webinar: t("webinar"),
  };
}

export function eventFormatLabels(t: Translator<"eventFormats">): Record<EventFormat, string> {
  return {
    in_person: t("inPerson"),
    hybrid: t("hybrid"),
    online: t("online"),
  };
}

export function primarySpecialtyLabels(
  t: Translator<"specialties">,
): Record<PrimarySpecialty, string> {
  return {
    orthopedic_spine_surgeon: t("orthopedicSpineSurgeon"),
    neurosurgeon_spine: t("neurosurgeonSpine"),
  };
}

const SUBSPECIALTY_KEY_SET: ReadonlySet<string> = new Set(SUGGESTED_SUBSPECIALTIES);

export function subspecialtyLabels(t: Translator<"subspecialties">): Record<SubspecialtyKey, string> {
  return Object.fromEntries(SUGGESTED_SUBSPECIALTIES.map((key) => [key, t(key)])) as Record<
    SubspecialtyKey,
    string
  >;
}

/**
 * A surgeon's stored subspecialty is either one of the coded suggested
 * keys (translated per locale) or free text they typed themselves (shown
 * verbatim, in whatever language they wrote it — never translated).
 */
export function resolveSubspecialtyLabel(
  value: string,
  labels: Record<SubspecialtyKey, string>,
): string {
  return SUBSPECIALTY_KEY_SET.has(value) ? labels[value as SubspecialtyKey] : value;
}

export function consultationFormatLabels(
  t: Translator<"consultationFormats">,
): Record<ConsultationFormat, string> {
  return {
    in_person: t("inPerson"),
    telemedicine: t("telemedicine"),
    both: t("both"),
  };
}

const LOCALE_TAGS = { es: "es-419", en: "en-US", pt: "pt-BR" } as const;

function resolveLocaleTag(locale: string): string {
  return LOCALE_TAGS[locale as keyof typeof LOCALE_TAGS] ?? LOCALE_TAGS.es;
}

/** Formatea una fecha YYYY-MM-DD sin desplazarla al huso horario local. */
export function formatDate(dateStr: string, locale: string): string {
  return new Intl.DateTimeFormat(resolveLocaleTag(locale), {
    year: "numeric",
    month: "long",
    day: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${dateStr}T00:00:00Z`));
}

export function formatDateShort(dateStr: string, locale: string): string {
  return new Intl.DateTimeFormat(resolveLocaleTag(locale), {
    year: "numeric",
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${dateStr}T00:00:00Z`));
}

export function formatDateRange(startDate: string, endDate: string, locale: string): string {
  if (endDate === startDate) return formatDate(startDate, locale);
  return `${formatDateShort(startDate, locale)} – ${formatDate(endDate, locale)}`;
}

export function formatTimeRange(
  startTime: string | null,
  endTime: string | null,
  locale: string,
): string | null {
  if (!startTime) return null;
  const format = (t: string) => {
    const [h, m] = t.split(":").map(Number);
    const d = new Date(Date.UTC(2000, 0, 1, h, m));
    return new Intl.DateTimeFormat(resolveLocaleTag(locale), {
      hour: "numeric",
      minute: "2-digit",
      timeZone: "UTC",
    }).format(d);
  };
  return endTime ? `${format(startTime)} – ${format(endTime)}` : format(startTime);
}
