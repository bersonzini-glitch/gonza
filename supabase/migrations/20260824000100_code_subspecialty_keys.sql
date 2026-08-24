-- Recodes the 15 suggested subspecialty values in surgeon_specialties from
-- free-text display strings (in whatever language they happened to be
-- entered) to stable snake_case keys, so the UI can show a translated
-- label per locale (see subspecialtyLabels() in src/lib/format.ts).
--
-- Custom subspecialties a surgeon typed themselves (not one of the 15
-- suggested ones) don't match any row below and are left untouched,
-- exactly as entered — same as bios and other free text, they're never
-- translated.
--
-- Before the app had i18n, the same suggested subspecialty could be saved
-- in Spanish or in a stray English translation, producing two separate
-- rows for one surgeon (e.g. "Columna degenerativa" and "Degenerative
-- Spine"). Recoding both to the same key would violate the
-- surgeon_specialties_unique (surgeon_id, specialty) constraint, so
-- duplicates are deleted first — keeping the oldest row per surgeon per
-- canonical key — before the survivors are updated.

begin;

create temporary table subspecialty_key_map (old_value text primary key, new_key text not null)
  on commit drop;

insert into subspecialty_key_map (old_value, new_key) values
  ('Columna degenerativa', 'degenerative_spine'),
  ('Degenerative Spine', 'degenerative_spine'),
  ('Deformidad espinal', 'spinal_deformity'),
  ('Spinal Deformity', 'spinal_deformity'),
  ('Trauma espinal', 'spinal_trauma'),
  ('Spinal Trauma', 'spinal_trauma'),
  ('Cirugía mínimamente invasiva', 'minimally_invasive_surgery'),
  ('Minimally Invasive Surgery', 'minimally_invasive_surgery'),
  ('Tumores de columna / Oncología', 'spine_tumors_oncology'),
  ('Spine Tumor / Oncology', 'spine_tumors_oncology'),
  ('Spine Tumors / Oncology', 'spine_tumors_oncology'),
  ('Columna pediátrica', 'pediatric_spine'),
  ('Pediatric Spine', 'pediatric_spine'),
  ('Cirugía de revisión de columna', 'spine_revision_surgery'),
  ('Revision Spine Surgery', 'spine_revision_surgery'),
  ('Spine Revision Surgery', 'spine_revision_surgery'),
  ('Infecciones de columna', 'spine_infections'),
  ('Spine Infections', 'spine_infections'),
  ('Columna deportiva', 'sports_spine'),
  ('Sports Spine', 'sports_spine'),
  ('Manejo del dolor', 'pain_management'),
  ('Pain Management', 'pain_management'),
  ('Robótica y navegación', 'robotics_navigation'),
  ('Robotics & Navigation', 'robotics_navigation'),
  ('Robotics and Navigation', 'robotics_navigation'),
  ('Cirugía endoscópica de columna', 'endoscopic_spine_surgery'),
  ('Endoscopic Spine Surgery', 'endoscopic_spine_surgery'),
  ('Columna cervical', 'cervical_spine'),
  ('Cervical Spine', 'cervical_spine'),
  ('Columna lumbar', 'lumbar_spine'),
  ('Lumbar Spine', 'lumbar_spine'),
  ('Escoliosis', 'scoliosis'),
  ('Scoliosis', 'scoliosis');

-- 1) Delete rows that would collide with another row for the same surgeon
--    once remapped to the canonical key, keeping the oldest survivor.
with ranked as (
  select
    ss.id,
    row_number() over (
      partition by ss.surgeon_id, coalesce(skm.new_key, ss.specialty)
      order by ss.created_at asc, ss.id asc
    ) as rn
  from public.surgeon_specialties ss
  left join subspecialty_key_map skm on skm.old_value = ss.specialty
)
delete from public.surgeon_specialties
where id in (select id from ranked where rn > 1);

-- 2) Recode the survivors to their canonical key.
update public.surgeon_specialties ss
set specialty = skm.new_key
from subspecialty_key_map skm
where skm.old_value = ss.specialty;

commit;
