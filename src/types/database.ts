// Hand-maintained to mirror supabase/migrations/*.sql exactly. Keep in sync
// manually (or regenerate with `supabase gen types typescript` once the
// project is linked to a live Supabase instance) whenever the schema
// changes.
//
// Every table needs `Relationships: []` and the schema needs `Views: {}`
// even though we don't use either — @supabase/postgrest-js's `GenericTable`
// / `GenericSchema` constraints require those keys to be present or the
// whole Database type silently fails to match and every query builder
// call falls back to `never` row types instead of raising a clear error.

export type ProfileRole = "user" | "admin";

export type SurgeonStatus = "draft" | "submitted" | "approved" | "rejected" | "suspended";

export type PrimarySpecialty = "orthopedic_spine_surgeon" | "neurosurgeon_spine";

export type ConsultationFormat = "in_person" | "telemedicine" | "both";

export type EventType = "congress" | "conference" | "course" | "workshop" | "webinar";

export type EventFormat = "in_person" | "hybrid" | "online";

export type EventStatus = "pending" | "approved" | "rejected";

export type EventSourceType =
  "official_society" | "hospital" | "university" | "organizer" | "rss" | "public_api" | "other";

type ProfilesRow = {
  id: string;
  username: string;
  full_name: string | null;
  role: ProfileRole;
  created_at: string;
  updated_at: string;
};

type SurgeonProfilesRow = {
  id: string;
  user_id: string;
  slug: string;
  full_name: string;
  primary_specialty: PrimarySpecialty;
  bio: string | null;
  hospital_affiliations: string[];
  medical_license_number: string | null;
  medical_license_country: string | null;
  specialist_license_number: string | null;
  years_experience: number | null;
  consultation_format: ConsultationFormat;
  telemedicine_available: boolean;
  in_person_available: boolean;
  languages: string[];
  website_url: string | null;
  instagram_url: string | null;
  linkedin_url: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  photo_path: string | null;
  status: SurgeonStatus;
  is_demo: boolean;
  rejection_reason: string | null;
  submitted_at: string | null;
  approved_at: string | null;
  approved_by: string | null;
  last_verified_at: string | null;
  created_at: string;
  updated_at: string;
};

type SurgeonSpecialtiesRow = {
  id: string;
  surgeon_id: string;
  specialty: string;
  created_at: string;
};

type SurgeonLocationsRow = {
  id: string;
  surgeon_id: string;
  country: string;
  city: string;
  is_primary: boolean;
  created_at: string;
};

type EventsRow = {
  id: string;
  slug: string;
  title: string;
  description: string;
  organizer: string;
  event_type: EventType;
  format: EventFormat;
  country: string;
  city: string | null;
  venue: string | null;
  start_date: string;
  end_date: string;
  start_time: string | null;
  end_time: string | null;
  timezone: string;
  date_note: string | null;
  topics: string[];
  official_url: string;
  registration_url: string | null;
  source_url: string;
  status: EventStatus;
  is_featured: boolean;
  last_verified_at: string;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

type EventSourcesRow = {
  id: string;
  event_id: string;
  source_url: string;
  source_name: string;
  source_type: EventSourceType;
  fetched_at: string;
  notes: string | null;
};

type AdminAuditLogsRow = {
  id: string;
  actor_id: string | null;
  action: string;
  target_table: string;
  target_id: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
};

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: ProfilesRow;
        Insert: Partial<ProfilesRow> & { id: string; username: string };
        Update: Partial<ProfilesRow>;
        Relationships: [];
      };
      surgeon_profiles: {
        Row: SurgeonProfilesRow;
        Insert: Partial<SurgeonProfilesRow> & {
          user_id: string;
          slug: string;
          full_name: string;
          primary_specialty: PrimarySpecialty;
        };
        Update: Partial<SurgeonProfilesRow>;
        Relationships: [];
      };
      surgeon_specialties: {
        Row: SurgeonSpecialtiesRow;
        Insert: Partial<SurgeonSpecialtiesRow> & { surgeon_id: string; specialty: string };
        Update: Partial<SurgeonSpecialtiesRow>;
        Relationships: [];
      };
      surgeon_locations: {
        Row: SurgeonLocationsRow;
        Insert: Partial<SurgeonLocationsRow> & {
          surgeon_id: string;
          country: string;
          city: string;
        };
        Update: Partial<SurgeonLocationsRow>;
        Relationships: [];
      };
      events: {
        Row: EventsRow;
        Insert: Partial<EventsRow> & {
          slug: string;
          title: string;
          description: string;
          organizer: string;
          event_type: EventType;
          format: EventFormat;
          country: string;
          start_date: string;
          end_date: string;
          official_url: string;
          source_url: string;
        };
        Update: Partial<EventsRow>;
        Relationships: [];
      };
      event_sources: {
        Row: EventSourcesRow;
        Insert: Partial<EventSourcesRow> & {
          event_id: string;
          source_url: string;
          source_name: string;
          source_type: EventSourceType;
        };
        Update: Partial<EventSourcesRow>;
        Relationships: [];
      };
      admin_audit_logs: {
        Row: AdminAuditLogsRow;
        Insert: Partial<AdminAuditLogsRow> & { action: string; target_table: string };
        Update: Partial<AdminAuditLogsRow>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      get_email_by_username: {
        Args: { lookup_username: string };
        Returns: string | null;
      };
      is_username_available: {
        Args: { check_username: string };
        Returns: boolean;
      };
      check_rate_limit: {
        Args: {
          p_identifier: string;
          p_action: string;
          p_max_attempts: number;
          p_window_seconds: number;
        };
        Returns: boolean;
      };
      log_admin_action: {
        Args: {
          p_action: string;
          p_target_table: string;
          p_target_id: string | null;
          p_metadata?: Record<string, unknown>;
        };
        Returns: string;
      };
    };
  };
}
