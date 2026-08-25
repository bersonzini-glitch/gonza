-- events.language: the language the event/course/congress is actually
-- conducted in (not the viewer's UI locale). Defaults to 'Español' only so
-- existing rows satisfy the not-null constraint on add; every new event
-- must set it explicitly going forward (see makeEventSchema).
alter table public.events add column language text not null default 'Español';

create index events_language_idx on public.events (language);
