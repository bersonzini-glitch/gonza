-- unaccent(text) is STABLE (it reads the active text search configuration),
-- which Postgres refuses inside index expressions / generated columns.
-- unaccent(regdictionary, text) pinned to the 'unaccent' dictionary is
-- deterministic, so we wrap it in an IMMUTABLE function and use that
-- everywhere we need accent-insensitive search to be indexable.
create or replace function public.immutable_unaccent(input text)
returns text
language sql
immutable
parallel safe
as $$
  select extensions.unaccent('unaccent', coalesce(input, ''));
$$;
