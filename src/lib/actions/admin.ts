"use server";

import { randomUUID } from "node:crypto";

import { revalidatePath } from "next/cache";
import { after } from "next/server";
import { getTranslations } from "next-intl/server";

import { searchUpcomingEvents, type KnownEvent } from "@/lib/ai/event-search";
import { logAdminAction } from "@/lib/audit";
import { requireAdmin } from "@/lib/auth/session";
import { slugify } from "@/lib/slug";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { SURGEON_PHOTOS_BUCKET } from "@/lib/supabase/storage";
import { makeEventSchema, type EventInput } from "@/lib/validation/event";
import {
  deriveConsultationAvailability,
  makeSurgeonProfileSchema,
  PHOTO_ALLOWED_TYPES,
  PHOTO_MAX_BYTES,
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

export async function approveSurgeonAction(
  locale: string,
  surgeonId: string,
): Promise<AdminActionResult> {
  const tErrors = await getTranslations({ locale, namespace: "adminActions" });
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

  if (error || !surgeon) return { error: error?.message ?? tErrors("approveFailed") };

  await logAdminAction(supabase, "approve_surgeon_profile", "surgeon_profiles", surgeonId, {
    admin: admin.username,
  });

  revalidatePath("/admin/surgeons");
  revalidatePath("/surgeons");
  revalidatePath(`/surgeons/${surgeon.slug}`);
  return { success: true };
}

export async function rejectSurgeonAction(
  locale: string,
  surgeonId: string,
  reason: string,
): Promise<AdminActionResult> {
  const tErrors = await getTranslations({ locale, namespace: "adminActions" });
  if (!reason.trim()) return { error: tErrors("reasonRequiredReject") };
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
  locale: string,
  surgeonId: string,
  reason: string,
): Promise<AdminActionResult> {
  const tErrors = await getTranslations({ locale, namespace: "adminActions" });
  if (!reason.trim()) return { error: tErrors("reasonRequiredSuspend") };
  const { admin, supabase } = await requireAdminClient();

  const { data: surgeon, error } = await supabase
    .from("surgeon_profiles")
    .update({ status: "suspended", rejection_reason: reason.trim() })
    .eq("id", surgeonId)
    .select("slug")
    .single();

  if (error || !surgeon) return { error: error?.message ?? tErrors("suspendFailed") };

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
  locale: string,
  surgeonId: string,
  input: SurgeonProfileFormValues,
): Promise<AdminActionResult> {
  const { admin, supabase } = await requireAdminClient();
  const [tValidation, tErrors] = await Promise.all([
    getTranslations({ locale, namespace: "surgeonValidation" }),
    getTranslations({ locale, namespace: "adminActions" }),
  ]);

  const parsed = makeSurgeonProfileSchema(tValidation).safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? tErrors("invalidData") };
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
      hospital_affiliations: data.hospitalAffiliations ?? [],
      medical_license_number: data.medicalLicenseNumber || null,
      medical_license_country: data.medicalLicenseCountry || null,
      specialist_license_number: data.specialistLicenseNumber || null,
      years_experience: data.yearsExperience ?? null,
      consultation_format: data.consultationFormat,
      in_person_available: inPersonAvailable,
      telemedicine_available: telemedicineAvailable,
      languages: data.languages,
      website_url: data.websiteUrl || null,
      instagram_url: data.instagramUrl || null,
      linkedin_url: data.linkedinUrl || null,
      contact_email: data.contactEmail || null,
      contact_phone: data.contactPhone || null,
    })
    .eq("id", surgeonId);

  if (error) {
    if (error.code === "23505") {
      return { error: tErrors("slugTaken") };
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

export async function adminUploadSurgeonPhotoAction(
  locale: string,
  surgeonId: string,
  formData: FormData,
): Promise<AdminActionResult> {
  const { admin, supabase } = await requireAdminClient();
  const tErrors = await getTranslations({ locale, namespace: "surgeonActions" });

  const file = formData.get("photo");
  if (!(file instanceof File) || file.size === 0) {
    return { error: tErrors("selectImageToUpload") };
  }
  if (!PHOTO_ALLOWED_TYPES.includes(file.type as (typeof PHOTO_ALLOWED_TYPES)[number])) {
    return { error: tErrors("onlyImageTypes") };
  }
  if (file.size > PHOTO_MAX_BYTES) {
    return { error: tErrors("imageTooLarge") };
  }

  try {
    const { data: surgeon } = await supabase
      .from("surgeon_profiles")
      .select("id, user_id, slug, photo_path")
      .eq("id", surgeonId)
      .maybeSingle();

    if (!surgeon) return { error: tErrors("createProfileBeforePhoto") };

    const extension =
      file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
    const path = `${surgeon.user_id}/${randomUUID()}.${extension}`;

    // The storage bucket's insert policy only allows uploads into the
    // caller's own `${auth.uid()}/...` folder (see
    // supabase/migrations/20260822001000_storage.sql) — unlike select/
    // update/delete, it has no admin bypass, so an admin uploading into a
    // surgeon's folder needs the service-role client to get past RLS here.
    // The admin check already happened in requireAdminClient() above.
    const adminStorage = createAdminClient();

    const { error: uploadError } = await adminStorage.storage
      .from(SURGEON_PHOTOS_BUCKET)
      .upload(path, file, { contentType: file.type, upsert: false });

    if (uploadError) return { error: tErrors("uploadError", { message: uploadError.message }) };

    const previousPath = surgeon.photo_path;

    const { error: updateError } = await supabase
      .from("surgeon_profiles")
      .update({ photo_path: path })
      .eq("id", surgeon.id);

    if (updateError) {
      await adminStorage.storage.from(SURGEON_PHOTOS_BUCKET).remove([path]);
      return { error: updateError.message };
    }

    if (previousPath) {
      await adminStorage.storage.from(SURGEON_PHOTOS_BUCKET).remove([previousPath]);
    }

    await logAdminAction(supabase, "update_surgeon_photo", "surgeon_profiles", surgeonId, {
      admin: admin.username,
    });

    revalidatePath(`/admin/surgeons/${surgeonId}`);
    revalidatePath(`/surgeons/${surgeon.slug}`);
    return { success: true };
  } catch (err) {
    // A server misconfiguration (e.g. a missing env var) throws instead of
    // returning a Supabase {error} — without this, that throw would escape
    // the transition on the client and trigger the app's full-page error
    // boundary instead of the inline message the form already renders.
    console.error("adminUploadSurgeonPhotoAction failed unexpectedly:", err);
    return { error: tErrors("uploadFailedUnexpected") };
  }
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

export async function createEventAction(
  locale: string,
  input: EventInput,
): Promise<AdminActionResult> {
  const { admin, supabase } = await requireAdminClient();
  const [tValidation, tErrors] = await Promise.all([
    getTranslations({ locale, namespace: "eventValidation" }),
    getTranslations({ locale, namespace: "adminActions" }),
  ]);

  const parsed = makeEventSchema(tValidation).safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? tErrors("invalidData") };
  const data = parsed.data;

  const slug = `${slugify(data.title)}-${randomUUID().slice(0, 6)}`;

  const { data: event, error } = await supabase
    .from("events")
    .insert({ ...eventFieldsFromInput(data), slug, created_by: admin.id })
    .select("id, slug")
    .single();

  if (error || !event) return { error: error?.message ?? tErrors("createEventFailed") };

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
  locale: string,
  eventId: string,
  input: EventInput,
): Promise<AdminActionResult> {
  const { admin, supabase } = await requireAdminClient();
  const [tValidation, tErrors] = await Promise.all([
    getTranslations({ locale, namespace: "eventValidation" }),
    getTranslations({ locale, namespace: "adminActions" }),
  ]);

  const parsed = makeEventSchema(tValidation).safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? tErrors("invalidData") };
  const data = parsed.data;

  const { data: event, error } = await supabase
    .from("events")
    .update(eventFieldsFromInput(data))
    .eq("id", eventId)
    .select("slug")
    .single();

  if (error || !event) return { error: error?.message ?? tErrors("updateEventFailed") };

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

export async function approveEventAction(
  locale: string,
  eventId: string,
): Promise<AdminActionResult> {
  const tErrors = await getTranslations({ locale, namespace: "adminActions" });
  const { admin, supabase } = await requireAdminClient();

  const { data: event, error } = await supabase
    .from("events")
    .update({
      status: "approved",
      last_verified_at: new Date().toISOString().slice(0, 10),
    })
    .eq("id", eventId)
    .select("slug")
    .single();

  if (error || !event) return { error: error?.message ?? tErrors("approveFailed") };

  await logAdminAction(supabase, "approve_event", "events", eventId, { admin: admin.username });

  revalidatePath("/admin/events");
  revalidatePath("/events");
  revalidatePath(`/events/${event.slug}`);
  return { success: true };
}

export async function rejectEventAction(
  locale: string,
  eventId: string,
): Promise<AdminActionResult> {
  const tErrors = await getTranslations({ locale, namespace: "adminActions" });
  const { admin, supabase } = await requireAdminClient();

  const { error } = await supabase.from("events").update({ status: "rejected" }).eq("id", eventId);
  if (error) return { error: error?.message ?? tErrors("rejectFailed") };

  await logAdminAction(supabase, "reject_event", "events", eventId, { admin: admin.username });

  revalidatePath("/admin/events");
  return { success: true };
}

// ---------------------------------------------------------------------------
// AI event search
// ---------------------------------------------------------------------------

// User-chosen cap ("Hasta 10 (Recomendado)") — kept as a plain constant
// rather than an admin-configurable option, matching the "botón simple,
// alcance fijo" search scope the user picked over a per-search config form.
const AI_EVENT_SEARCH_MAX_EVENTS = 10;

/**
 * Fires an AI-assisted web search for upcoming LATAM spine-surgery events
 * and inserts whatever it finds as `status: 'pending'` events for an admin
 * to review later — the user explicitly asked for "se dispara y avisa
 * después" (fire-and-forget) rather than a blocking request, since the
 * underlying Anthropic call (agentic web search + structured extraction)
 * can take well over a minute.
 *
 * The actual search + inserts run in `after()`, once the response admins
 * see (the toast confirming the search started) has already been sent.
 * Everything the background task needs — the authenticated Supabase
 * client, translations, the known-events list — is resolved *before*
 * `after()` is called, since only Server Actions (not this callback) are
 * guaranteed access to request-time APIs like the cookie store that
 * `supabase` was built from.
 */
export async function triggerAiEventSearchAction(locale: string): Promise<AdminActionResult> {
  const { admin, supabase } = await requireAdminClient();
  const [tValidation, tErrors] = await Promise.all([
    getTranslations({ locale, namespace: "eventValidation" }),
    getTranslations({ locale, namespace: "adminActions" }),
  ]);

  // Checked up front so a missing key fails the button click immediately
  // instead of silently failing inside after() once the response is
  // already gone, which admins would only notice on the next page refresh.
  if (!process.env.ANTHROPIC_API_KEY) return { error: tErrors("aiSearchNotConfigured") };

  const { data: existingEvents, error: existingError } = await supabase
    .from("events")
    .select("title, official_url, start_date")
    .order("start_date", { ascending: false })
    .limit(300);

  if (existingError) return { error: tErrors("aiSearchFailedToStart", { message: existingError.message }) };

  const knownEvents: KnownEvent[] = (existingEvents ?? []).map((e) => ({
    title: e.title,
    officialUrl: e.official_url,
    startDate: e.start_date,
  }));

  await logAdminAction(supabase, "ai_event_search_started", "events", null, {
    admin: admin.username,
  });

  after(async () => {
    try {
      const result = await searchUpcomingEvents({
        knownEvents,
        maxEvents: AI_EVENT_SEARCH_MAX_EVENTS,
      });

      let inserted = 0;
      const insertErrors: string[] = [];

      for (const candidate of result.candidates) {
        const parsed = makeEventSchema(tValidation).safeParse({
          ...candidate,
          isFeatured: false,
          lastVerifiedAt: new Date().toISOString().slice(0, 10),
        });

        const candidateLabel =
          typeof candidate.title === "string" ? candidate.title : "(sin título)";

        if (!parsed.success) {
          insertErrors.push(`${candidateLabel}: ${parsed.error.issues[0]?.message ?? "inválido"}`);
          continue;
        }

        const data = parsed.data;
        const slug = `${slugify(data.title)}-${randomUUID().slice(0, 6)}`;

        const { data: event, error } = await supabase
          .from("events")
          .insert({
            ...eventFieldsFromInput(data),
            // Forced regardless of what the model/schema default produced —
            // AI-found events always land as pending, never live directly.
            status: "pending",
            slug,
            created_by: admin.id,
          })
          .select("id")
          .single();

        if (error || !event) {
          insertErrors.push(`${candidateLabel}: ${error?.message ?? "no se pudo crear"}`);
          continue;
        }

        const { error: sourcesError } = await supabase.from("event_sources").insert(
          data.sources.map((s) => ({
            event_id: event.id,
            source_name: s.sourceName,
            source_url: s.sourceUrl,
            source_type: s.sourceType,
            notes: s.notes || null,
          })),
        );

        if (sourcesError) {
          insertErrors.push(`${candidateLabel}: ${sourcesError.message}`);
          continue;
        }

        inserted += 1;
      }

      await logAdminAction(supabase, "ai_event_search_completed", "events", null, {
        admin: admin.username,
        found: result.candidates.length,
        inserted,
        webSearchesUsed: result.webSearchesUsed,
        errors: insertErrors,
      });
    } catch (err) {
      console.error("triggerAiEventSearchAction background task failed:", err);
      await logAdminAction(supabase, "ai_event_search_failed", "events", null, {
        admin: admin.username,
        error: err instanceof Error ? err.message : String(err),
      }).catch((logErr) => console.error("Failed to log ai_event_search_failed:", logErr));
    }

    revalidatePath("/admin/events");
  });

  return { success: true };
}
