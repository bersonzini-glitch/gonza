-- surgeon_specialties: subspecialties / procedures offered by a surgeon
-- (e.g. "Minimally Invasive Surgery", "Deformity", "Trauma"). Free-text tag
-- rows rather than a fixed enum so admins can extend the vocabulary without
-- a migration; the application constants module supplies the canonical
-- suggested list for form inputs and filters.
create table public.surgeon_specialties (
  id uuid primary key default gen_random_uuid(),
  surgeon_id uuid not null references public.surgeon_profiles (id) on delete cascade,
  specialty text not null,
  created_at timestamptz not null default now(),
  constraint surgeon_specialties_unique unique (surgeon_id, specialty),
  constraint specialty_length check (char_length(specialty) between 2 and 80)
);

create index surgeon_specialties_surgeon_idx on public.surgeon_specialties (surgeon_id);
create index surgeon_specialties_specialty_idx on public.surgeon_specialties (specialty);

-- surgeon_locations: a surgeon may practice in more than one city. Directory
-- country/city filters and search join against this table.
create table public.surgeon_locations (
  id uuid primary key default gen_random_uuid(),
  surgeon_id uuid not null references public.surgeon_profiles (id) on delete cascade,
  country text not null,
  city text not null,
  is_primary boolean not null default true,
  created_at timestamptz not null default now(),
  constraint surgeon_locations_unique unique (surgeon_id, country, city)
);

create index surgeon_locations_surgeon_idx on public.surgeon_locations (surgeon_id);
create index surgeon_locations_country_idx on public.surgeon_locations (country);
create index surgeon_locations_city_idx on public.surgeon_locations (city);
