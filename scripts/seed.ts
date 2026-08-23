/**
 * Seeds the database with:
 *  - a small set of REAL, source-verified LATAM spine congresses
 *    (supabase/seed/events.json — see supabase/seed/README.md for the
 *    verification methodology and date the sources were checked)
 *  - a handful of clearly-marked DEMO surgeon profiles (is_demo = true)
 *    used to illustrate the directory before real surgeons register
 *    (supabase/seed/demo-surgeons.json)
 *
 * Safe to re-run: everything is upserted by a stable slug/email, never
 * duplicated. Requires the service-role key, so it must only ever be run
 * from a trusted machine (local dev or a CI/deploy step you control), not
 * from a browser or an untrusted server.
 *
 * Usage: npm run seed
 */
import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

import type {
  ConsultationFormat,
  Database,
  EventFormat,
  EventSourceType,
  EventType,
  PrimarySpecialty,
} from "../src/types/database";

try {
  process.loadEnvFile(".env.local");
} catch {
  // .env.local may not exist in CI, where these vars are injected another way.
}

const dirname = path.dirname(fileURLToPath(import.meta.url));

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

function requireEnv(name: string, value: string | undefined): string {
  if (!value) {
    console.error(`Missing required environment variable: ${name}`);
    process.exit(1);
  }
  return value;
}

function slugify(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

const SEED_VERIFIED_DATE = "2026-08-22";

interface SeedEventSource {
  sourceName: string;
  sourceUrl: string;
  sourceType: EventSourceType;
  notes: string;
}

interface SeedEvent {
  title: string;
  organizer: string;
  officialUrl: string;
  sourceUrl: string;
  city: string;
  country: string;
  venue: string;
  startDate: string;
  endDate: string;
  dateNote: string;
  format: EventFormat;
  eventType: EventType;
  topics: string[];
  registrationUrl: string;
  description: string;
  sources: SeedEventSource[];
}

interface SeedLocation {
  country: string;
  city: string;
  isPrimary: boolean;
}

interface SeedSurgeon {
  username: string;
  email: string;
  fullName: string;
  professionalTitle: string;
  primarySpecialty: PrimarySpecialty;
  bio: string;
  hospitalAffiliation: string | null;
  medicalLicenseNumber: string | null;
  medicalLicenseCountry: string | null;
  yearsExperience: number | null;
  consultationFormat: ConsultationFormat;
  languages: string[];
  websiteUrl: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  subspecialties: string[];
  locations: SeedLocation[];
}

async function seedEvents(supabase: SupabaseClient<Database>) {
  const events: SeedEvent[] = JSON.parse(
    readFileSync(path.join(dirname, "../supabase/seed/events.json"), "utf8"),
  );

  for (const event of events) {
    const slug = slugify(event.title);

    const { data: row, error } = await supabase
      .from("events")
      .upsert(
        {
          slug,
          title: event.title,
          description: event.description,
          organizer: event.organizer,
          event_type: event.eventType,
          format: event.format,
          country: event.country,
          city: event.city || null,
          venue: event.venue || null,
          start_date: event.startDate,
          end_date: event.endDate,
          timezone: "UTC",
          date_note: event.dateNote || null,
          topics: event.topics,
          official_url: event.officialUrl,
          registration_url: event.registrationUrl || null,
          source_url: event.sourceUrl,
          status: "approved",
          last_verified_at: SEED_VERIFIED_DATE,
        },
        { onConflict: "slug" },
      )
      .select("id")
      .single();

    if (error || !row) {
      console.error(`Failed to upsert event "${event.title}": ${error?.message}`);
      continue;
    }

    await supabase.from("event_sources").delete().eq("event_id", row.id);
    const { error: sourcesError } = await supabase.from("event_sources").insert(
      event.sources.map((s) => ({
        event_id: row.id,
        source_name: s.sourceName,
        source_url: s.sourceUrl,
        source_type: s.sourceType,
        notes: s.notes || null,
        fetched_at: new Date(`${SEED_VERIFIED_DATE}T00:00:00Z`).toISOString(),
      })),
    );
    if (sourcesError) {
      console.error(`Failed to seed sources for "${event.title}": ${sourcesError.message}`);
      continue;
    }

    console.log(`✓ Event: ${event.title}`);
  }
}

async function seedDemoSurgeons(supabase: SupabaseClient<Database>) {
  const surgeons: SeedSurgeon[] = JSON.parse(
    readFileSync(path.join(dirname, "../supabase/seed/demo-surgeons.json"), "utf8"),
  );

  for (const surgeon of surgeons) {
    let userId: string | null = null;
    let page = 1;
    const perPage = 200;
    while (userId === null) {
      const { data, error } = await supabase.auth.admin.listUsers({ page, perPage });
      if (error) throw new Error(`Failed to list users: ${error.message}`);
      const match = data.users.find((u) => u.email?.toLowerCase() === surgeon.email.toLowerCase());
      if (match) userId = match.id;
      if (data.users.length < perPage) break;
      page += 1;
    }

    if (!userId) {
      const { data, error } = await supabase.auth.admin.createUser({
        email: surgeon.email,
        password: crypto.randomUUID(),
        email_confirm: true,
        user_metadata: { username: surgeon.username, full_name: surgeon.fullName },
      });
      if (error || !data.user) {
        console.error(`Failed to create demo user ${surgeon.email}: ${error?.message}`);
        continue;
      }
      userId = data.user.id;
    }

    await supabase
      .from("profiles")
      .upsert(
        { id: userId, username: surgeon.username, full_name: surgeon.fullName },
        { onConflict: "id" },
      );

    const inPersonAvailable =
      surgeon.consultationFormat === "in_person" || surgeon.consultationFormat === "both";
    const telemedicineAvailable =
      surgeon.consultationFormat === "telemedicine" || surgeon.consultationFormat === "both";

    const { data: surgeonRow, error } = await supabase
      .from("surgeon_profiles")
      .upsert(
        {
          user_id: userId,
          slug: slugify(surgeon.fullName),
          full_name: surgeon.fullName,
          professional_title: surgeon.professionalTitle,
          primary_specialty: surgeon.primarySpecialty,
          bio: surgeon.bio,
          hospital_affiliation: surgeon.hospitalAffiliation,
          medical_license_number: surgeon.medicalLicenseNumber,
          medical_license_country: surgeon.medicalLicenseCountry,
          years_experience: surgeon.yearsExperience,
          consultation_format: surgeon.consultationFormat,
          in_person_available: inPersonAvailable,
          telemedicine_available: telemedicineAvailable,
          languages: surgeon.languages,
          website_url: surgeon.websiteUrl,
          contact_email: surgeon.contactEmail,
          contact_phone: surgeon.contactPhone,
          status: "approved",
          is_demo: true,
          approved_at: new Date().toISOString(),
          last_verified_at: SEED_VERIFIED_DATE,
        },
        { onConflict: "user_id" },
      )
      .select("id")
      .single();

    if (error || !surgeonRow) {
      console.error(`Failed to upsert surgeon "${surgeon.fullName}": ${error?.message}`);
      continue;
    }

    await supabase.from("surgeon_specialties").delete().eq("surgeon_id", surgeonRow.id);
    await supabase
      .from("surgeon_specialties")
      .insert(
        surgeon.subspecialties.map((specialty) => ({ surgeon_id: surgeonRow.id, specialty })),
      );

    await supabase.from("surgeon_locations").delete().eq("surgeon_id", surgeonRow.id);
    await supabase.from("surgeon_locations").insert(
      surgeon.locations.map((loc) => ({
        surgeon_id: surgeonRow.id,
        country: loc.country,
        city: loc.city,
        is_primary: loc.isPrimary,
      })),
    );

    console.log(`✓ Demo surgeon: ${surgeon.fullName}`);
  }
}

async function main() {
  const url = requireEnv("NEXT_PUBLIC_SUPABASE_URL", SUPABASE_URL);
  const serviceRoleKey = requireEnv("SUPABASE_SERVICE_ROLE_KEY", SERVICE_ROLE_KEY);

  const supabase = createClient<Database>(url, serviceRoleKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

  console.log("Seeding events…");
  await seedEvents(supabase);

  console.log("\nSeeding demo surgeons…");
  await seedDemoSurgeons(supabase);

  console.log("\n✅ Seed complete.");
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
