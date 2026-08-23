-- surgeon_profiles: the core directory record. A profile is never publicly
-- readable until status = 'approved' (enforced by RLS in
-- 20260822001100_rls_policies.sql), regardless of any client-supplied flag.
create table public.surgeon_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  slug text not null,
  full_name text not null,
  professional_title text,
  primary_specialty public.primary_specialty not null,
  bio text,
  hospital_affiliation text,
  medical_license_number text,
  medical_license_country text,
  years_experience smallint,
  consultation_format public.consultation_format not null default 'in_person',
  telemedicine_available boolean not null default false,
  in_person_available boolean not null default true,
  languages text[] not null default '{}',
  website_url text,
  contact_email text,
  contact_phone text,
  photo_path text,
  status public.surgeon_status not null default 'draft',
  is_demo boolean not null default false,
  rejection_reason text,
  submitted_at timestamptz,
  approved_at timestamptz,
  approved_by uuid references public.profiles (id),
  last_verified_at date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  search_vector tsvector generated always as (
    setweight(to_tsvector('simple', public.immutable_unaccent(full_name)), 'A') ||
    setweight(to_tsvector('simple', public.immutable_unaccent(coalesce(professional_title, ''))), 'B') ||
    setweight(to_tsvector('simple', public.immutable_unaccent(coalesce(hospital_affiliation, ''))), 'C') ||
    setweight(to_tsvector('simple', public.immutable_unaccent(coalesce(bio, ''))), 'D')
  ) stored,
  constraint surgeon_profiles_user_id_key unique (user_id),
  constraint surgeon_profiles_slug_key unique (slug),
  constraint years_experience_range check (
    years_experience is null or years_experience between 0 and 70
  ),
  constraint website_url_format check (
    website_url is null or website_url ~* '^https?://'
  ),
  constraint contact_email_format check (
    contact_email is null or contact_email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'
  )
);

comment on table public.surgeon_profiles is
  'Directory listing owned by a single user. photo_path is a private Supabase Storage object path; public photo URLs are only ever issued server-side for approved profiles.';
comment on column public.surgeon_profiles.is_demo is
  'True for clearly-marked seed/demo data. Always surfaced in the UI so visitors cannot mistake sample entries for verified real surgeons.';
comment on column public.surgeon_profiles.status is
  'draft -> submitted -> approved|rejected -> suspended. Transitions are enforced by server actions and admin_audit_logs, not by client input.';

create index surgeon_profiles_status_idx on public.surgeon_profiles (status);
create index surgeon_profiles_specialty_idx on public.surgeon_profiles (primary_specialty);
create index surgeon_profiles_languages_idx on public.surgeon_profiles using gin (languages);
create index surgeon_profiles_search_idx on public.surgeon_profiles using gin (search_vector);
create index surgeon_profiles_name_trgm_idx on public.surgeon_profiles
  using gin (full_name extensions.gin_trgm_ops);
