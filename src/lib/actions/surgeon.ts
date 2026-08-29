"use server";

import { randomUUID } from "node:crypto";

import { revalidatePath } from "next/cache";
import { getTranslations } from "next-intl/server";

import { getCurrentProfile } from "@/lib/auth/session";
import { checkRateLimit } from "@/lib/rate-limit";
import { insertWithUniqueSlug } from "@/lib/slug";
import { createClient } from "@/lib/supabase/server";
import { SURGEON_PHOTOS_BUCKET } from "@/lib/supabase/storage";
import {
  deriveConsultationAvailability,
  makeSurgeonProfileSchema,
  PHOTO_ALLOWED_TYPES,
  PHOTO_MAX_BYTES,
  type SurgeonProfileFormValues,
} from "@/lib/validation/surgeon";

export interface SurgeonActionResult {
  error?: string;
  success?: boolean;
}

export async function saveSurgeonProfileAction(
  locale: string,
  input: SurgeonProfileFormValues,
): Promise<SurgeonActionResult> {
  const [tValidation, tErrors] = await Promise.all([
    getTranslations({ locale, namespace: "surgeonValidation" }),
    getTranslations({ locale, namespace: "surgeonActions" }),
  ]);

  const profile = await getCurrentProfile();
  if (!profile) return { error: tErrors("mustSignIn") };

  const parsed = makeSurgeonProfileSchema(tValidation).safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? tErrors("invalidData") };
  }
  const data = parsed.data;
  const { inPersonAvailable, telemedicineAvailable } = deriveConsultationAvailability(
    data.consultationFormat,
  );

  const supabase = await createClient();

  const allowed = await checkRateLimit(supabase, profile.id, "surgeon-profile-save", 30, 3600);
  if (!allowed) return { error: tErrors("tooManyChanges") };

  const { data: existing } = await supabase
    .from("surgeon_profiles")
    .select("id, status, slug")
    .eq("user_id", profile.id)
    .maybeSingle();

  const baseFields = {
    full_name: data.fullName,
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
  };

  let surgeonId: string;
  let previousSlug: string | null = null;

  if (existing) {
    surgeonId = existing.id;
    const slugChanged = !!data.slug && data.slug !== existing.slug;
    if (slugChanged) previousSlug = existing.slug;
    const updateFields = slugChanged ? { ...baseFields, slug: data.slug } : baseFields;
    const { error } = await supabase
      .from("surgeon_profiles")
      .update(updateFields)
      .eq("id", surgeonId);
    if (error) {
      if (error.code === "23505") {
        return { error: tErrors("slugTaken") };
      }
      return { error: tErrors("saveFailed", { message: error.message }) };
    }
  } else {
    const { data: inserted, error } = await insertWithUniqueSlug<{ id: string }>(
      data.fullName,
      async (slug) => {
        return await supabase
          .from("surgeon_profiles")
          .insert({ ...baseFields, user_id: profile.id, slug, status: "draft" })
          .select("id")
          .single();
      },
    );
    if (error || !inserted) {
      return { error: tErrors("createFailed", { message: error?.message ?? "" }) };
    }
    surgeonId = inserted.id;
  }

  const { error: deleteSpecialtiesError } = await supabase
    .from("surgeon_specialties")
    .delete()
    .eq("surgeon_id", surgeonId);
  if (deleteSpecialtiesError) return { error: deleteSpecialtiesError.message };

  if (data.subspecialties.length > 0) {
    const { error: insertSpecialtiesError } = await supabase
      .from("surgeon_specialties")
      .insert(data.subspecialties.map((specialty) => ({ surgeon_id: surgeonId, specialty })));
    if (insertSpecialtiesError) return { error: insertSpecialtiesError.message };
  }

  const { error: deleteLocationsError } = await supabase
    .from("surgeon_locations")
    .delete()
    .eq("surgeon_id", surgeonId);
  if (deleteLocationsError) return { error: deleteLocationsError.message };

  const { error: insertLocationsError } = await supabase.from("surgeon_locations").insert(
    data.locations.map((loc) => ({
      surgeon_id: surgeonId,
      country: loc.country,
      city: loc.city,
      is_primary: loc.isPrimary,
    })),
  );
  if (insertLocationsError) return { error: insertLocationsError.message };

  const { error: preferencesError } = await supabase
    .from("profiles")
    .update({
      notify_new_events: data.notifyNewEvents,
      notify_suggested_invitations: data.notifySuggestedInvitations,
    })
    .eq("id", profile.id);
  if (preferencesError) return { error: preferencesError.message };

  revalidatePath("/dashboard");
  if (previousSlug) {
    revalidatePath(`/surgeons/${previousSlug}`);
    revalidatePath(`/surgeons/${data.slug}`);
  }
  return { success: true };
}

export async function submitSurgeonProfileAction(locale: string): Promise<SurgeonActionResult> {
  const tErrors = await getTranslations({ locale, namespace: "surgeonActions" });

  const profile = await getCurrentProfile();
  if (!profile) return { error: tErrors("mustSignIn") };

  const supabase = await createClient();

  const { data: surgeon } = await supabase
    .from("surgeon_profiles")
    .select("id, status, bio, photo_path, surgeon_specialties(id), surgeon_locations(id)")
    .eq("user_id", profile.id)
    .maybeSingle();

  if (!surgeon) return { error: tErrors("createProfileFirst") };
  if (!["draft", "rejected"].includes(surgeon.status)) {
    return { error: tErrors("alreadyInStatus", { status: surgeon.status }) };
  }
  if (!surgeon.bio || surgeon.bio.trim().length < 50) {
    return { error: tErrors("bioTooShortToSubmit") };
  }
  if (!surgeon.surgeon_locations || surgeon.surgeon_locations.length === 0) {
    return { error: tErrors("locationRequiredToSubmit") };
  }
  if (!surgeon.surgeon_specialties || surgeon.surgeon_specialties.length === 0) {
    return { error: tErrors("subspecialtyRequiredToSubmit") };
  }

  const { error } = await supabase
    .from("surgeon_profiles")
    .update({ status: "submitted" })
    .eq("id", surgeon.id);

  if (error) return { error: error.message };

  revalidatePath("/dashboard");
  return { success: true };
}

export async function uploadSurgeonPhotoAction(
  locale: string,
  formData: FormData,
): Promise<SurgeonActionResult> {
  const tErrors = await getTranslations({ locale, namespace: "surgeonActions" });

  const profile = await getCurrentProfile();
  if (!profile) return { error: tErrors("mustSignIn") };

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
    const supabase = await createClient();

    const allowed = await checkRateLimit(supabase, profile.id, "surgeon-photo-upload", 10, 3600);
    if (!allowed) return { error: tErrors("tooManyUploads") };

    const { data: surgeon } = await supabase
      .from("surgeon_profiles")
      .select("id, photo_path")
      .eq("user_id", profile.id)
      .maybeSingle();

    if (!surgeon) return { error: tErrors("createProfileBeforePhoto") };

    const extension =
      file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
    const path = `${profile.id}/${randomUUID()}.${extension}`;

    const { error: uploadError } = await supabase.storage
      .from(SURGEON_PHOTOS_BUCKET)
      .upload(path, file, { contentType: file.type, upsert: false });

    if (uploadError) return { error: tErrors("uploadError", { message: uploadError.message }) };

    const previousPath = surgeon.photo_path;

    const { error: updateError } = await supabase
      .from("surgeon_profiles")
      .update({ photo_path: path })
      .eq("id", surgeon.id);

    if (updateError) {
      await supabase.storage.from(SURGEON_PHOTOS_BUCKET).remove([path]);
      return { error: updateError.message };
    }

    if (previousPath) {
      await supabase.storage.from(SURGEON_PHOTOS_BUCKET).remove([previousPath]);
    }

    revalidatePath("/dashboard");
    return { success: true };
  } catch (err) {
    // A server misconfiguration (e.g. a missing env var) throws instead of
    // returning a Supabase {error} — without this, that throw would escape
    // the transition on the client and trigger the app's full-page error
    // boundary instead of the inline message the form already renders.
    console.error("uploadSurgeonPhotoAction failed unexpectedly:", err);
    return { error: tErrors("uploadFailedUnexpected") };
  }
}
