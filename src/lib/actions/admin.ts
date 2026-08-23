"use server";

import { randomUUID } from "node:crypto";

import { revalidatePath } from "next/cache";

import { logAdminAction } from "@/lib/audit";
import { requireAdmin } from "@/lib/auth/session";
import { slugify } from "@/lib/slug";
import { createClient } from "@/lib/supabase/server";
import { SURGEON_PHOTOS_BUCKET } from "@/lib/supabase/storage";
import { eventSchema, type EventInput } from "@/lib/validation/event";
import {
  deriveConsultationAvailability,
  surgeonProfileSchema,
  type SurgeonProfileFormValues,
} from "@/lib/validation/surgeon";

export interface AdminActionResult {
  error?: string;
  success?: boolean;
}

async function requireAdminClient() {
  const admin = await requireAdmin("/admin");
  const supabase = await createClient();
  return { admin, supabase };
}

// ---------------------------------------------------------------------------
// Surgeon moderation
// ---------------------------------------------------------------------------

export async function approveSurgeonAction(surgeonId: string): Promise<AdminActionResult> {
  const { admin, supabase } = await requireAdminClient();

  const { data: surgeon, error } = await supabase
    .from("surgeon_profiles")
    .update({
      status: "approved",
      rejection_reason: null,
      last_verified_at: new Date().toISOString().slice(0, 10),
    })
    .eq("id", surgeonId)
    .select("slug")
    .single();

  if (error || !surgeon) return { error: error?.message ?? "No se pudo aprobar el perfil." };

  await logAdminAction(supabase, "approve_surgeon_profile", "surgeon_profiles", surgeonId, {
    admin: admin.username,
  });

  revalidatePath("/admin/surgeons");
  revalidatePath("/surgeons");
  revalidatePath(`/surgeons/${surgeon.slug}`);
  return { success: true };
}

export async function rejectSurgeonAction(
  surgeonId: string,
  reason: string,
): Promise<AdminActionResult> {
  if (!reason.trim()) return { error: "El motivo es obligatorio para que el cirujano sepa qué corregir." };
  const { admin, supabase } = await requireAdminClient();

  const { error } = await supabase
    .from("surgeon_profiles")
    .update({ status: "rejected", rejection_reason: reason.trim() })
    .eq("id", surgeonId);

  if (error) return { error: error.message };

  await logAdminAction(supabase, "reject_surgeon_profile", "surgeon_profiles", surgeonId, {
    admin: admin.username,
    reason,
  });

  revalidatePath("/admin/surgeons");
  return { success: true };
}

export async function suspendSurgeonAction(
  surgeonId: string,
  reason: string,
): Promise<AdminActionResult> {
  if (!reason.trim()) return { error: "El motivo es obligatorio para el historial de auditoría." };
  const { admin, supabase } = await requireAdminClient();

  const { data: surgeon, error } = await supabase
    .from("surgeon_profiles")
    .update({ status: "suspended", rejection_reason: reason.trim() })
    .eq("id", surgeonId)
    .select("slug")
    .single();

  if (error || !surgeon) return { error: error?.message ?? "No se pudo suspender el perfil." };

  await logAdminAction(supabase, "suspend_surgeon_profile", "surgeon_profiles", surgeonId, {
    admin: admin.username,
    reason,
  });

  revalidatePath("/admin/surgeons");
  revalidatePath("/surgeons");
  revalidatePath(`/surgeons/${surgeon.slug}`);
  return { success: true };
}

export async function deleteSurgeonAction(surgeonId: string): Promise<AdminActionResult> {
  const { admin, supabase } = await requireAdminClient();

  const { data: surgeon } = await supabase
    .from("surgeon_profiles")
    .select("slug, photo_path")
    .eq("id", surgeonId)
    .maybeSingle();

  // Written before the delete so the log entry survives even though the
  // row it references will be gone.
  await logAdminAction(supabase, "delete_surgeon_profile", "surgeon_profiles", surgeonId, {
    admin: admin.username,
    slug: surgeon?.slug,
  });

  if (surgeon?.photo_path) {
    await supabase.storage.from(SURGEON_PHOTOS_BUCKET).remove([surgeon.photo_path]);
  }

  const { error } = await supabase.from("surgeon_profiles").delete().eq("id", surgeonId);
  if (error) return { error: error.message };

  revalidatePath("/admin/surgeons");
  revalidatePath("/surgeons");
  return { success: true };
}

export async function adminUpdateSurgeonProfileAction(
  surgeonId: string,
  input: SurgeonProfileFormValues,
): Promise<AdminActionResult> {
  const { admin, supabase } = await requireAdminClient();

  const parsed = surgeonProfileSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  const data = parsed.data;
  const { inPersonAvailable, telemedicineAvailable } = deriveConsultationAvailability(
    data.consultationFormat,
  );

  const { data: current } = await supabase
    .from("surgeon_profiles")
    .select("slug")
    .eq("id", surgeonId)
    .single();

  const slugChanged = !!data.slug && !!current && data.slug !== current.slug;

  const { error } = await supabase
    .from("surgeon_profiles")
    .update({
      full_name: data.fullName,
      ...(slugChanged ? { slug: data.slug } : {}),
      primary_specialty: data.primarySpecialty,
      bio: data.bio,
      hospital_affiliation: data.hospitalAffiliation || null,
      medical_license_number: data.medicalLicenseNumber || null,
      medical_license_country: data.medicalLicenseCountry || null,
      years_experience: data.yearsExperience ?? null,
      consultation_format: data.consultationFormat,
      in_person_available: inPersonAvailable,
      telemedicine_available: telemedicineAvailable,
      languages: data.languages,
      website_url: data.websiteUrl || null,
      contact_email: data.contactEmail || null,
      contact_phone: data.contactPhone || null,
    })
    .eq("id", surgeonId);

  if (error) {
    if (error.code === "23505") {
      return { error: "Esa dirección de perfil ya está en uso. Probá con otra." };
    }
    return { error: error.message };
  }

  await supabase.from("surgeon_specialties").delete().eq("surgeon_id", surgeonId);
  if (data.subspecialties.length > 0) {
    await supabase
      .from("surgeon_specialties")
      .insert(data.subspecialties.map((specialty) => ({ surgeon_id: surgeonId, specialty })));
  }

  await supabase.from("surgeon_locations").delete().eq("surgeon_id", surgeonId);
  await supabase.from("surgeon_locations").insert(
    data.locations.map((loc) => ({
      surgeon_id: surgeonId,
      country: loc.country,
      city: loc.city,
      is_primary: loc.isPrimary,
    })),
  );

  await logAdminAction(supabase, "edit_surgeon_profile", "surgeon_profiles", surgeonId, {
    admin: admin.username,
  });

  revalidatePath(`/admin/surgeons/${surgeonId}`);
  revalidatePath("/surgeons");
  if (slugChanged && current) {
    revalidatePath(`/surgeons/${current.slug}`);
    revalidatePath(`/surgeons/${data.slug}`);
  }
  return { success: true };
}

// ---------------------------------------------------------------------------
// Events
// ---------------------------------------------------------------------------

function eventFieldsFromInput(input: EventInput) {
  return {
    title: input.title,
    description: input.description,
    event_type: input.eventType,
    format: input.format,
    status: input.status,
    is_featured: input.isFeatured,
    start_date: input.startDate,
    end_date: input.endDate,
    start_time: input.startTime || null,
    end_time: input.endTime || null,
    date_note: input.dateNote || null,
    timezone: input.timezone,
    country: input.country,
    city: input.city || null,
    venue: input.venue || null,
    organizer: input.organizer,
    topics: input.topics,
    official_url: input.officialUrl,
    registration_url: input.registrationUrl || null,
    source_url: input.sourceUrl,
    last_verified_at: input.lastVerifiedAt,
  };
}

export async function createEventAction(input: EventInput): Promise<AdminActionResult> {
  const { admin, supabase } = await requireAdminClient();

  const parsed = eventSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  const data = parsed.data;

  const slug = `${slugify(data.title)}-${randomUUID().slice(0, 6)}`;

  const { data: event, error } = await supabase
    .from("events")
    .insert({ ...eventFieldsFromInput(data), slug, created_by: admin.id })
    .select("id, slug")
    .single();

  if (error || !event) return { error: error?.message ?? "No se pudo crear el evento." };

  const { error: sourcesError } = await supabase.from("event_sources").insert(
    data.sources.map((s) => ({
      event_id: event.id,
      source_name: s.sourceName,
      source_url: s.sourceUrl,
      source_type: s.sourceType,
      notes: s.notes || null,
    })),
  );
  if (sourcesError) return { error: sourcesError.message };

  await logAdminAction(supabase, "create_event", "events", event.id, { admin: admin.username });

  revalidatePath("/admin/events");
  revalidatePath("/events");
  revalidatePath("/");
  return { success: true };
}

export async function updateEventAction(
  eventId: string,
  input: EventInput,
): Promise<AdminActionResult> {
  const { admin, supabase } = await requireAdminClient();

  const parsed = eventSchema.safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? "Datos inválidos" };
  const data = parsed.data;

  const { data: event, error } = await supabase
    .from("events")
    .update(eventFieldsFromInput(data))
    .eq("id", eventId)
    .select("slug")
    .single();

  if (error || !event) return { error: error?.message ?? "No se pudo actualizar el evento." };

  await supabase.from("event_sources").delete().eq("event_id", eventId);
  const { error: sourcesError } = await supabase.from("event_sources").insert(
    data.sources.map((s) => ({
      event_id: eventId,
      source_name: s.sourceName,
      source_url: s.sourceUrl,
      source_type: s.sourceType,
      notes: s.notes || null,
    })),
  );
  if (sourcesError) return { error: sourcesError.message };

  await logAdminAction(supabase, "update_event", "events", eventId, { admin: admin.username });

  revalidatePath("/admin/events");
  revalidatePath("/events");
  revalidatePath(`/events/${event.slug}`);
  return { success: true };
}

export async function deleteEventAction(eventId: string): Promise<AdminActionResult> {
  const { admin, supabase } = await requireAdminClient();

  await logAdminAction(supabase, "delete_event", "events", eventId, { admin: admin.username });

  const { error } = await supabase.from("events").delete().eq("id", eventId);
  if (error) return { error: error.message };

  revalidatePath("/admin/events");
  revalidatePath("/events");
  return { success: true };
}
