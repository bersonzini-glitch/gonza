-- Extensions required across the schema.
-- pgcrypto: gen_random_uuid() for primary keys.
-- pg_trgm: trigram indexes for fuzzy/partial full-text search (surgeon names, event titles).
-- unaccent: accent-insensitive search, important for Spanish/Portuguese names and cities.
create extension if not exists pgcrypto with schema extensions;
create extension if not exists pg_trgm with schema extensions;
create extension if not exists unaccent with schema extensions;
-- citext: case-insensitive text, used for usernames and lookup email/username matching.
create extension if not exists citext with schema extensions;
