-- Individual detail pages (/societies/[slug]), mirroring events' slug
-- pattern — each society becomes its own indexable URL instead of living
-- only inside the /societies listing page.
alter table public.scientific_societies add column slug text;

-- Backfill slugs for the already-seeded societies. This mirrors the
-- accent-stripping in src/lib/slug.ts closely enough for readable URLs;
-- any character it doesn't cover just falls through to the '-' collapse
-- below, and a short random suffix guarantees uniqueness the same way
-- createSocietyAction() does for new rows, so a partial transliteration
-- never causes a collision.
update public.scientific_societies
set slug = (
  regexp_replace(
    regexp_replace(
      lower(
        translate(
          name,
          'áàäâãÁÀÄÂÃéèëêÉÈËÊíìïîÍÌÏÎóòöôõÓÒÖÔÕúùüûÚÙÜÛñÑçÇ',
          'aaaaaAAAAAeeeeEEEEiiiiIIIIoooooOOOOOuuuuUUUUnNcC'
        )
      ),
      '[^a-z0-9]+', '-', 'g'
    ),
    '(^-+|-+$)', '', 'g'
  )
) || '-' || substr(md5(random()::text), 1, 6);

alter table public.scientific_societies alter column slug set not null;
alter table public.scientific_societies add constraint scientific_societies_slug_key unique (slug);
create index scientific_societies_slug_idx on public.scientific_societies (slug);
