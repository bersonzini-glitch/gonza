-- events: congresses, courses, workshops and webinars related to spine
-- surgery across LATAM. Every row must trace back to a real public source
-- (see event_sources) — this table is populated by admins and the seed
-- script, never by public submission, so status defaults to 'approved'
-- but the column exists so moderation/workflow can be tightened later
-- without a schema change.
create table public.events (
  id uuid primary key default gen_random_uuid(),
  slug text not null,
  title text not null,
  description text not null,
  organizer text not null,
  event_type public.event_type not null,
  format public.event_format not null,
  country text not null,
  city text,
  venue text,
  start_date date not null,
  end_date date not null,
  start_time time,
  end_time time,
  timezone text not null default 'UTC',
  date_note text,
  topics text[] not null default '{}',
  official_url text not null,
  registration_url text,
  source_url text not null,
  status public.event_status not null default 'approved',
  is_featured boolean not null default false,
  last_verified_at date not null default current_date,
  created_by uuid references public.profiles (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  search_vector tsvector generated always as (
    setweight(to_tsvector('simple', public.immutable_unaccent(title)), 'A') ||
    setweight(to_tsvector('simple', public.immutable_unaccent(organizer)), 'B') ||
    setweight(to_tsvector('simple', public.immutable_unaccent(coalesce(city, ''))), 'B') ||
    setweight(to_tsvector('simple', public.immutable_unaccent(country)), 'B') ||
    setweight(to_tsvector('simple', public.immutable_unaccent(description)), 'D')
  ) stored,
  constraint events_slug_key unique (slug),
  constraint events_date_range check (end_date >= start_date),
  constraint events_official_url_format check (official_url ~* '^https?://'),
  constraint events_source_url_format check (source_url ~* '^https?://'),
  constraint events_registration_url_format check (
    registration_url is null or registration_url ~* '^https?://'
  )
);

comment on table public.events is
  'Congress/course/workshop/webinar listings. Only real, source-backed events — see event_sources for provenance and last_verified_at for freshness.';
comment on column public.events.date_note is
  'Free-text fallback when a source only gives a month/year or "annual, dates TBD" rather than exact days, e.g. "Annual course; 2027 dates not yet published".';

create index events_status_idx on public.events (status);
create index events_start_date_idx on public.events (start_date);
create index events_country_idx on public.events (country);
create index events_event_type_idx on public.events (event_type);
create index events_format_idx on public.events (format);
create index events_topics_idx on public.events using gin (topics);
create index events_search_idx on public.events using gin (search_vector);
create index events_featured_idx on public.events (is_featured) where is_featured = true;

-- event_sources: provenance trail. An event can be corroborated by more
-- than one public source; this is what backs the "data-source
-- transparency" section and the methodology page.
create table public.event_sources (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references public.events (id) on delete cascade,
  source_url text not null,
  source_name text not null,
  source_type public.event_source_type not null,
  fetched_at timestamptz not null default now(),
  notes text,
  constraint event_sources_url_format check (source_url ~* '^https?://')
);

create index event_sources_event_idx on public.event_sources (event_id);
