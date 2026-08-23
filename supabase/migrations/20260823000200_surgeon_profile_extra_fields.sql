-- Surgeons often work at more than one hospital/clinic, so hospital
-- affiliation becomes a list (like languages) instead of a single field.
-- Adds a specialist board certification number (separate from the general
-- medical license) and optional Instagram/LinkedIn links.

-- search_vector weights hospital_affiliation, so it has to be dropped and
-- rebuilt (along with its index) around the new array column.
alter table public.surgeon_profiles drop column search_vector;

alter table public.surgeon_profiles
  add column hospital_affiliations text[] not null default '{}';

update public.surgeon_profiles
set hospital_affiliations = array[hospital_affiliation]
where hospital_affiliation is not null and hospital_affiliation <> '';

alter table public.surgeon_profiles drop column hospital_affiliation;

alter table public.surgeon_profiles
  add column specialist_license_number text,
  add column instagram_url text,
  add column linkedin_url text,
  add constraint instagram_url_format check (
    instagram_url is null or instagram_url ~* '^https?://'
  ),
  add constraint linkedin_url_format check (
    linkedin_url is null or linkedin_url ~* '^https?://'
  );

-- Postgres can't prove array_to_string() is immutable at the generated
-- column's call site, so it's pinned the same way immutable_unaccent()
-- pins unaccent().
create or replace function public.immutable_array_to_string(input text[], sep text)
returns text
language sql
immutable
parallel safe
as $$
  select array_to_string(input, sep);
$$;

alter table public.surgeon_profiles add column search_vector tsvector generated always as (
  setweight(to_tsvector('simple', public.immutable_unaccent(full_name)), 'A') ||
  setweight(
    to_tsvector(
      'simple',
      public.immutable_unaccent(public.immutable_array_to_string(hospital_affiliations, ' '))
    ),
    'B'
  ) ||
  setweight(to_tsvector('simple', public.immutable_unaccent(coalesce(bio, ''))), 'C')
) stored;

create index surgeon_profiles_search_idx on public.surgeon_profiles using gin (search_vector);
