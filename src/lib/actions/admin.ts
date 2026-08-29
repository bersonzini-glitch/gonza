"use server";

import { randomUUID } from "node:crypto";

import { revalidatePath } from "next/cache";
import { getTranslations } from "next-intl/server";
import { Resend } from "resend";

import { logAdminAction } from "@/lib/audit";
import { requireAdmin } from "@/lib/auth/session";
import { listApprovedSurgeonEmailsForAdmin } from "@/lib/data/admin";
import { renderBrandedEmailHtml, textToParagraphsHtml } from "@/lib/email/template";
import { checkRateLimit } from "@/lib/rate-limit";
import { insertWithUniqueSlug } from "@/lib/slug";
import { createAdminClient } from "@/lib/supabase/admin";
import { createClient } from "@/lib/supabase/server";
import { SURGEON_PHOTOS_BUCKET } from "@/lib/supabase/storage";
import {
  makeAdminEmailSchema,
  parseEmailList,
  type AdminEmailInput,
} from "@/lib/validation/admin-email";
import { makeEventSchema, type EventInput } from "@/lib/validation/event";
import { makeSocietySchema, type SocietyInput } from "@/lib/validation/society";
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

/**
 * Deletes a registered account that never got a submitted surgeon
 * profile — see listUnstartedUsersForAdmin() in src/lib/data/admin.ts for
 * exactly which accounts that is (no profile row at all, or a draft one
 * never sent for review). Re-checks that condition here rather than
 * trusting the id the client sent, in case the account submitted a real
 * profile between page load and this click.
 *
 * Removing the auth.users row is enough on its own: profiles cascades
 * from auth.users, and surgeon_profiles (plus its specialties/locations
 * rows) cascades from profiles — see the `on delete cascade` references in
 * supabase/migrations/20260822000300_profiles.sql and
 * .../20260822000400_surgeon_profiles.sql. Deleting via auth.users also
 * requires the service-role client, since auth.admin.deleteUser() isn't
 * reachable through the regular RLS-scoped client.
 */
export async function deleteUnstartedUserAction(userId: string): Promise<AdminActionResult> {
  const { admin, supabase } = await requireAdminClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("username")
    .eq("id", userId)
    .maybeSingle();

  const { data: surgeon } = await supabase
    .from("surgeon_profiles")
    .select("photo_path, status")
    .eq("user_id", userId)
    .maybeSingle();

  if (surgeon && surgeon.status !== "draft") {
    return { error: "Esta cuenta ya tiene un perfil enviado — refrescá la página." };
  }

  // Written before the delete so the log entry survives even though the
  // row it references will be gone.
  await logAdminAction(supabase, "delete_unstarted_user", "profiles", userId, {
    admin: admin.username,
    username: profile?.username,
  });

  const serviceClient = createAdminClient();

  if (surgeon?.photo_path) {
    await serviceClient.storage.from(SURGEON_PHOTOS_BUCKET).remove([surgeon.photo_path]);
  }

  const { error } = await serviceClient.auth.admin.deleteUser(userId);
  if (error) return { error: error.message };

  revalidatePath("/admin/surgeons");
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
    language: input.language,
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

  const { data: event, error } = await insertWithUniqueSlug<{ id: string; slug: string }>(
    data.title,
    async (slug) => {
      return await supabase
        .from("events")
        .insert({ ...eventFieldsFromInput(data), slug, created_by: admin.id })
        .select("id, slug")
        .single();
    },
  );

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

  const { data: current } = await supabase
    .from("events")
    .select("slug")
    .eq("id", eventId)
    .single();

  const slugChanged = !!data.slug && !!current && data.slug !== current.slug;

  const { data: event, error } = await supabase
    .from("events")
    .update({ ...eventFieldsFromInput(data), ...(slugChanged ? { slug: data.slug } : {}) })
    .eq("id", eventId)
    .select("slug")
    .single();

  if (error) {
    if (error.code === "23505") return { error: tErrors("slugTaken") };
    return { error: error.message };
  }
  if (!event) return { error: tErrors("updateEventFailed") };

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
  if (slugChanged && current) {
    revalidatePath(`/events/${current.slug}`);
  }
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

/**
 * Deactivated 2026-08-25 at the user's request: a live run burned through
 * far more of the Anthropic token budget than expected, and they want to
 * approach automated event discovery a different way. The button that
 * called this was removed from /admin/events; this stub stays in place
 * (rather than deleting the feature outright) in case a reworked version
 * reuses pieces of it — see src/lib/ai/event-search.ts for the still-intact
 * search implementation this used to call via after().
 */
export async function triggerAiEventSearchAction(locale: string): Promise<AdminActionResult> {
  const tErrors = await getTranslations({ locale, namespace: "adminActions" });
  return { error: tErrors("aiSearchDisabled") };
}

// ---------------------------------------------------------------------------
// Scientific societies
// ---------------------------------------------------------------------------

function societyFieldsFromInput(input: SocietyInput) {
  return {
    name: input.name,
    description: input.description,
    country: input.country,
    specialties: input.specialties,
    website_url: input.websiteUrl,
  };
}

export async function createSocietyAction(
  locale: string,
  input: SocietyInput,
): Promise<AdminActionResult> {
  const { admin, supabase } = await requireAdminClient();
  const [tValidation, tErrors] = await Promise.all([
    getTranslations({ locale, namespace: "societyValidation" }),
    getTranslations({ locale, namespace: "adminActions" }),
  ]);

  const parsed = makeSocietySchema(tValidation).safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? tErrors("invalidData") };
  const data = parsed.data;

  const { data: society, error } = await insertWithUniqueSlug<{ id: string }>(
    data.name,
    async (slug) => {
      return await supabase
        .from("scientific_societies")
        .insert({ ...societyFieldsFromInput(data), slug, created_by: admin.id })
        .select("id")
        .single();
    },
  );

  if (error || !society) return { error: error?.message ?? tErrors("createSocietyFailed") };

  await logAdminAction(supabase, "create_society", "scientific_societies", society.id, {
    admin: admin.username,
  });

  revalidatePath("/admin/scientific-societies");
  revalidatePath("/societies");
  return { success: true };
}

export async function updateSocietyAction(
  locale: string,
  societyId: string,
  input: SocietyInput,
): Promise<AdminActionResult> {
  const { admin, supabase } = await requireAdminClient();
  const [tValidation, tErrors] = await Promise.all([
    getTranslations({ locale, namespace: "societyValidation" }),
    getTranslations({ locale, namespace: "adminActions" }),
  ]);

  const parsed = makeSocietySchema(tValidation).safeParse(input);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? tErrors("invalidData") };
  const data = parsed.data;

  const { data: current } = await supabase
    .from("scientific_societies")
    .select("slug")
    .eq("id", societyId)
    .single();

  const slugChanged = !!data.slug && !!current && data.slug !== current.slug;

  const { data: society, error } = await supabase
    .from("scientific_societies")
    .update({ ...societyFieldsFromInput(data), ...(slugChanged ? { slug: data.slug } : {}) })
    .eq("id", societyId)
    .select("slug")
    .single();

  if (error) {
    if (error.code === "23505") return { error: tErrors("slugTaken") };
    return { error: error.message };
  }
  if (!society) return { error: tErrors("updateSocietyFailed") };

  await logAdminAction(supabase, "update_society", "scientific_societies", societyId, {
    admin: admin.username,
  });

  revalidatePath("/admin/scientific-societies");
  revalidatePath("/societies");
  revalidatePath(`/societies/${society.slug}`);
  if (slugChanged && current) {
    revalidatePath(`/societies/${current.slug}`);
  }
  return { success: true };
}

export async function deleteSocietyAction(societyId: string): Promise<AdminActionResult> {
  const { admin, supabase } = await requireAdminClient();

  await logAdminAction(supabase, "delete_society", "scientific_societies", societyId, {
    admin: admin.username,
  });

  const { error } = await supabase.from("scientific_societies").delete().eq("id", societyId);
  if (error) return { error: error.message };

  revalidatePath("/admin/scientific-societies");
  revalidatePath("/societies");
  return { success: true };
}

// ---------------------------------------------------------------------------
// Admin emailing
// ---------------------------------------------------------------------------

export interface AdminEmailActionResult {
  error?: string;
  success?: boolean;
  recipientCount?: number;
}

const ADMIN_EMAIL_FROM = process.env.ADMIN_EMAIL_FROM ?? "ColumnaLATAM <onboarding@resend.dev>";
const ADMIN_EMAIL_REPLY_TO = process.env.ADMIN_EMAIL_REPLY_TO ?? "noreply@columnalatam.org";

export async function sendAdminEmailAction(
  locale: string,
  data: AdminEmailInput,
): Promise<AdminEmailActionResult> {
  const [tValidation, tErrors] = await Promise.all([
    getTranslations({ locale, namespace: "adminEmailValidation" }),
    getTranslations({ locale, namespace: "adminEmailActions" }),
  ]);

  const { admin, supabase } = await requireAdminClient();

  const parsed = makeAdminEmailSchema(tValidation).safeParse(data);
  if (!parsed.success) return { error: parsed.error.issues[0]?.message ?? tErrors("invalidData") };
  const input = parsed.data;

  const allowed = await checkRateLimit(supabase, admin.id, "admin-email-send", 20, 3600);
  if (!allowed) return { error: tErrors("tooManySends") };

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.error("Admin email send is not configured: missing RESEND_API_KEY.");
    return { error: tErrors("notConfigured") };
  }

  let recipients: string[];
  if (input.mode === "single") {
    recipients = input.recipientEmail ? [input.recipientEmail] : [];
  } else if (input.audience === "custom") {
    recipients = parseEmailList(input.customRecipients ?? "");
  } else {
    recipients = (
      await listApprovedSurgeonEmailsForAdmin({
        notifyNewEvents: input.filterNotifyNewEvents,
        notifySuggestedInvitations: input.filterNotifySuggestedInvitations,
      })
    ).map((s) => s.email);
  }

  if (recipients.length === 0) return { error: tErrors("noRecipients") };

  const html = renderBrandedEmailHtml({
    heading: input.subject,
    bodyHtml: textToParagraphsHtml(input.message),
  });

  try {
    const resend = new Resend(apiKey);
    if (recipients.length === 1) {
      const { error } = await resend.emails.send({
        from: ADMIN_EMAIL_FROM,
        to: recipients[0],
        replyTo: ADMIN_EMAIL_REPLY_TO,
        subject: input.subject,
        html,
      });
      if (error) {
        console.error("Resend failed to send admin email:", error);
        return { error: tErrors("sendFailed") };
      }
    } else {
      // One independent email per recipient in a single batch call, so no
      // recipient sees anyone else's address (unlike a shared to/cc/bcc
      // list). Resend caps a batch at 100 emails, hence the chunking.
      const BATCH_SIZE = 100;
      for (let i = 0; i < recipients.length; i += BATCH_SIZE) {
        const chunk = recipients.slice(i, i + BATCH_SIZE);
        const { error } = await resend.batch.send(
          chunk.map((to) => ({
            from: ADMIN_EMAIL_FROM,
            to,
            replyTo: ADMIN_EMAIL_REPLY_TO,
            subject: input.subject,
            html,
          })),
        );
        if (error) {
          console.error("Resend failed to send admin email batch:", error);
          return { error: tErrors("sendFailed") };
        }
      }
    }
  } catch (err) {
    console.error("sendAdminEmailAction failed unexpectedly:", err);
    return { error: tErrors("sendFailed") };
  }

  await logAdminAction(supabase, "send_admin_email", "admin_email", null, {
    admin: admin.username,
    mode: input.mode,
    audience: input.mode === "bulk" ? input.audience : null,
    recipientCount: recipients.length,
    subject: input.subject,
  });

  return { success: true, recipientCount: recipients.length };
}
