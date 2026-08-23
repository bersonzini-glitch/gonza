-- The professional title field was removed from the surgeon profile. The
-- generated search_vector column weighted it, so it has to be dropped and
-- rebuilt (along with its index) before the column itself can go.
alter table public.surgeon_profiles drop column search_vector;
alter table public.surgeon_profiles drop column professional_title;

alter table public.surgeon_profiles add column search_vector tsvector generated always as (
  setweight(to_tsvector('simple', public.immutable_unaccent(full_name)), 'A') ||
  setweight(to_tsvector('simple', public.immutable_unaccent(coalesce(hospital_affiliation, ''))), 'B') ||
  setweight(to_tsvector('simple', public.immutable_unaccent(coalesce(bio, ''))), 'C')
) stored;

create index surgeon_profiles_search_idx on public.surgeon_profiles using gin (search_vector);
