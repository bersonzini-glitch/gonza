"use server";

import { randomUUID } from "node:crypto";

import { revalidatePath } from "next/cache";

import { getCurrentProfile } from "@/lib/auth/session";
import { checkRateLimit } from "@/lib/rate-limit";
import { slugify } from "@/lib/slug";
import { createClient } from "@/lib/supabase/server";
import { SURGEON_PHOTOS_BUCKET } from "@/lib/supabase/storage";
import {
  deriveConsultationAvailability,
  surgeonProfileSchema,
  type SurgeonProfileFormValues,
} from "@/lib/validation/surgeon";

export interface SurgeonActionResult {
  error?: string;
  success?: boolean;
}

export async function saveSurgeonProfileAction(
  input: SurgeonProfileFormValues,
): Promise<SurgeonActionResult> {
  const profile = await getCurrentProfile();
  if (!profile) return { error: "You must be signed in." };

  const parsed = surgeonProfileSchema.safeParse(input);
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Invalid input" };
  }
  const data = parsed.data;
  const { inPersonAvailable, telemedicineAvailable } = deriveConsultationAvailability(
    data.consultationFormat,
  );

  const supabase = await createClient();

  const allowed = await checkRateLimit(supabase, profile.id, "surgeon-profile-save", 30, 3600);
  if (!allowed) return { error: "Too many changes. Please slow down and try again shortly." };

  const { data: existing } = await supabase
    .from("surgeon_profiles")
    .select("id, status, slug")
    .eq("user_id", profile.id)
    .maybeSingle();

  if (existing && !["draft", "rejected"].includes(existing.status)) {
    return {
      error: `Your profile can't be edited while it is ${existing.status}. Contact an administrator if changes are needed.`,
    };
  }

  const baseFields = {
    full_name: data.fullName,
    professional_title: data.professionalTitle || null,
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
  };

  let surgeonId: string;

  if (existing) {
    surgeonId = existing.id;
    const { error } = await supabase
      .from("surgeon_profiles")
      .update(baseFields)
      .eq("id", surgeonId);
    if (error) return { error: `Could not save profile: ${error.message}` };
  } else {
    const slug = `${slugify(data.fullName)}-${randomUUID().slice(0, 6)}`;
    const { data: inserted, error } = await supabase
      .from("surgeon_profiles")
      .insert({ ...baseFields, user_id: profile.id, slug, status: "draft" })
      .select("id")
      .single();
    if (error || !inserted) return { error: `Could not create profile: ${error?.message}` };
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

  revalidatePath("/dashboard");
  return { success: true };
}

export async function submitSurgeonProfileAction(): Promise<SurgeonActionResult> {
  const profile = await getCurrentProfile();
  if (!profile) return { error: "You must be signed in." };

  const supabase = await createClient();

  const { data: surgeon } = await supabase
    .from("surgeon_profiles")
    .select("id, status, bio, photo_path, surgeon_specialties(id), surgeon_locations(id)")
    .eq("user_id", profile.id)
    .maybeSingle();

  if (!surgeon) return { error: "Create your profile before submitting it." };
  if (!["draft", "rejected"].includes(surgeon.status)) {
    return { error: `Your profile is already ${surgeon.status}.` };
  }
  if (!surgeon.bio || surgeon.bio.trim().length < 50) {
    return { error: "Add a biography of at least 50 characters before submitting." };
  }
  if (!surgeon.surgeon_locations || surgeon.surgeon_locations.length === 0) {
    return { error: "Add at least one practice location before submitting." };
  }
  if (!surgeon.surgeon_specialties || surgeon.surgeon_specialties.length === 0) {
    return { error: "Add at least one subspecialty before submitting." };
  }

  const { error } = await supabase
    .from("surgeon_profiles")
    .update({ status: "submitted" })
    .eq("id", surgeon.id);

  if (error) return { error: error.message };

  revalidatePath("/dashboard");
  return { success: true };
}

const ALLOWED_PHOTO_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_PHOTO_BYTES = 5 * 1024 * 1024;

export async function uploadSurgeonPhotoAction(formData: FormData): Promise<SurgeonActionResult> {
  const profile = await getCurrentProfile();
  if (!profile) return { error: "You must be signed in." };

  const file = formData.get("photo");
  if (!(file instanceof File) || file.size === 0) {
    return { error: "Choose an image to upload." };
  }
  if (!ALLOWED_PHOTO_TYPES.includes(file.type)) {
    return { error: "Only JPEG, PNG, or WebP images are allowed." };
  }
  if (file.size > MAX_PHOTO_BYTES) {
    return { error: "Image must be smaller than 5 MB." };
  }

  const supabase = await createClient();

  const allowed = await checkRateLimit(supabase, profile.id, "surgeon-photo-upload", 10, 3600);
  if (!allowed) return { error: "Too many uploads. Please try again shortly." };

  const { data: surgeon } = await supabase
    .from("surgeon_profiles")
    .select("id, photo_path")
    .eq("user_id", profile.id)
    .maybeSingle();

  if (!surgeon) return { error: "Create your profile before uploading a photo." };

  const extension = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
  const path = `${profile.id}/${randomUUID()}.${extension}`;

  const { error: uploadError } = await supabase.storage
    .from(SURGEON_PHOTOS_BUCKET)
    .upload(path, file, { contentType: file.type, upsert: false });

  if (uploadError) return { error: `Upload failed: ${uploadError.message}` };

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
}
