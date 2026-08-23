import type {
  ConsultationFormat,
  EventFormat,
  EventType,
  PrimarySpecialty,
} from "@/types/database";

export const EVENT_TYPE_LABELS: Record<EventType, string> = {
  congress: "Congreso",
  conference: "Conferencia",
  course: "Curso",
  workshop: "Taller",
  webinar: "Webinar",
};

export const EVENT_FORMAT_LABELS: Record<EventFormat, string> = {
  in_person: "Presencial",
  hybrid: "Híbrido",
  online: "Online",
};

export const PRIMARY_SPECIALTY_LABELS: Record<PrimarySpecialty, string> = {
  orthopedic_spine_surgeon: "Traumatólogo especialista en columna",
  neurosurgeon_spine: "Neurocirujano especialista en columna",
};

export const CONSULTATION_FORMAT_LABELS: Record<ConsultationFormat, string> = {
  in_person: "Solo presencial",
  telemedicine: "Solo telemedicina",
  both: "Presencial y telemedicina",
};

const dateFormatter = new Intl.DateTimeFormat("es-419", {
  year: "numeric",
  month: "long",
  day: "numeric",
  timeZone: "UTC",
});

const shortDateFormatter = new Intl.DateTimeFormat("es-419", {
  year: "numeric",
  month: "short",
  day: "numeric",
  timeZone: "UTC",
});

/** Formatea una fecha YYYY-MM-DD sin desplazarla al huso horario local. */
export function formatDate(dateStr: string): string {
  return dateFormatter.format(new Date(`${dateStr}T00:00:00Z`));
}

export function formatDateShort(dateStr: string): string {
  return shortDateFormatter.format(new Date(`${dateStr}T00:00:00Z`));
}

export function formatDateRange(startDate: string, endDate: string): string {
  if (endDate === startDate) return formatDate(startDate);
  return `${shortDateFormatter.format(new Date(`${startDate}T00:00:00Z`))} – ${formatDate(endDate)}`;
}

export function formatTimeRange(startTime: string | null, endTime: string | null): string | null {
  if (!startTime) return null;
  const format = (t: string) => {
    const [h, m] = t.split(":").map(Number);
    const d = new Date(Date.UTC(2000, 0, 1, h, m));
    return new Intl.DateTimeFormat("es-419", {
      hour: "numeric",
      minute: "2-digit",
      timeZone: "UTC",
    }).format(d);
  };
  return endTime ? `${format(startTime)} – ${format(endTime)}` : format(startTime);
}
