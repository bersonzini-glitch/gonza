-- scientific_societies: directory of spine/pain-related scientific
-- societies by country, cross-referencing neurosurgery, orthopedics/
-- trauma, anesthesiology & pain, and rheumatology. Unlike events/
-- surgeon_profiles there is no moderation workflow — entries are
-- curated by admins only (never public submission), so a single
-- unconditional public-read policy is enough; no status column.
create table public.scientific_societies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text not null,
  country text not null,
  specialties text[] not null default '{}',
  website_url text not null,
  created_by uuid references public.profiles (id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint scientific_societies_website_url_format check (website_url ~* '^https?://')
);

comment on table public.scientific_societies is
  'Directory of scientific societies (spine, pain, rheumatology, etc.) by country, each linking to its official web presence. Admin-curated only.';

create index scientific_societies_country_idx on public.scientific_societies (country);
create index scientific_societies_specialties_idx on public.scientific_societies using gin (specialties);
create index scientific_societies_name_idx on public.scientific_societies (name);

alter table public.scientific_societies enable row level security;

create policy "scientific_societies_select_public"
  on public.scientific_societies for select
  to anon, authenticated
  using (true);

create policy "scientific_societies_write_admin"
  on public.scientific_societies for all
  to authenticated
  using (public.current_user_is_admin())
  with check (public.current_user_is_admin());

-- Seed data: international/regional bodies plus national societies across
-- 17 countries, hand-compiled from each society's own official web
-- presence. Paraguay was researched but had no dedicated society with a
-- confirmed official site, so it has no rows here (deliberately, not an
-- omission) — an admin can add one later from the panel once one exists.
insert into public.scientific_societies (name, description, country, specialties, website_url)
values
  ('International Society for the Advancement of Spine Surgery (ISASS)', 'Cirugía de columna: preservación de movimiento, cirugía mínimamente invasiva (MIS) y biológicos.', 'Internacional', ARRAY['Multidisciplinar / Internacional']::text[], 'https://isass.org'),
  ('International Society for the Study of the Lumbar Spine (ISSLS)', 'Referencia mundial en investigación de columna lumbar y dolor de espalda, desde 1974.', 'Internacional', ARRAY['Multidisciplinar / Internacional']::text[], 'https://issls.org'),
  ('Scoliosis Research Society (SRS)', 'Deformidades vertebrales; más de 1.300 miembros en 41 países.', 'Internacional', ARRAY['Multidisciplinar / Internacional','Traumatología']::text[], 'https://srs.org'),
  ('EUROSPINE — The Spine Society of Europe', 'Sociedad paneuropea de columna; investigación, formación y registro Spine Tango.', 'Internacional', ARRAY['Multidisciplinar / Internacional']::text[], 'https://eurospine.org'),
  ('North American Spine Society (NASS)', '~8.000 miembros: neurocirujanos, traumatólogos, fisiatras y anestesiólogos (EE. UU./Canadá).', 'Internacional', ARRAY['Multidisciplinar / Internacional']::text[], 'https://spine.org'),
  ('Cervical Spine Research Society (CSRS)', 'Patología clínica y de investigación de la columna cervical.', 'Internacional', ARRAY['Multidisciplinar / Internacional']::text[], 'https://csrs.org'),
  ('Cervical Spine Research Society — Europe', 'Capítulo europeo del CSRS.', 'Internacional', ARRAY['Multidisciplinar / Internacional']::text[], 'https://csrs-europe.org'),
  ('AO Spine', 'Comunidad académica global de cirugía de columna; incluye programa continuo para Latinoamérica.', 'Internacional', ARRAY['Multidisciplinar / Internacional']::text[], 'https://aospine.aofoundation.org'),
  ('International Pain and Spine Intervention Society (IPSIS)', 'Estándares para procedimientos intervencionistas de dolor de columna.', 'Internacional', ARRAY['Dolor / Anestesiología']::text[], 'https://ipsismed.org'),
  ('World Institute of Pain (WIP)', 'Certificación internacional en dolor intervencionista (FIPP/CIPS).', 'Internacional', ARRAY['Dolor / Anestesiología']::text[], 'https://worldinstituteofpain.org'),
  ('International Association for the Study of Pain (IASP)', 'Máxima entidad mundial en dolor; agrupa 95 capítulos nacionales.', 'Internacional', ARRAY['Dolor / Anestesiología']::text[], 'https://iasp-pain.org'),
  ('Assessment of SpondyloArthritis international Society (ASAS)', 'Criterios de clasificación y evaluación de espondiloartritis axial.', 'Internacional', ARRAY['Reumatología']::text[], 'https://asas-group.org'),
  ('Spondyloarthritis Research and Treatment Network (SPARTAN)', 'Red norteamericana de investigación y tratamiento de espondiloartritis.', 'Internacional', ARRAY['Reumatología']::text[], 'https://spartangroup.org'),
  ('World Federation of Neurosurgical Societies — Comité de Columna (WFNS Spine)', '130 sociedades miembro; ~50.000 neurocirujanos.', 'Internacional', ARRAY['Neurocirugía']::text[], 'https://wfns-spine.org'),
  ('Federación Latinoamericana de Sociedades de Neurocirugía (FLANC)', 'Incluye capítulo de Columna desde 1998; agrupa a las sociedades nacionales de la región.', 'Internacional', ARRAY['Neurocirugía']::text[], 'https://flancneurocirugia.org'),
  ('Federación Latinoamericana de Asociaciones para el Estudio del Dolor (FEDELAT)', 'Agrupa a los capítulos IASP de Latinoamérica.', 'Internacional', ARRAY['Dolor / Anestesiología']::text[], 'https://fedelat.com'),
  ('Sociedad Iberolatinoamericana de Columna (SILACO)', 'Fundada en 1997 (Cartagena de Indias); congreso bienal iberolatinoamericano de columna.', 'Internacional', ARRAY['Multidisciplinar / Internacional']::text[], 'https://silaco.org'),
  ('Asociación Argentina de Neurocirugía (AANC)', 'Cursos anuales de cirugía de columna y médula espinal.', 'Argentina', ARRAY['Neurocirugía']::text[], 'https://aanc.org.ar'),
  ('Sociedad Argentina de Patología de la Columna Vertebral (SAPCV)', 'Curso bienal oficial en patología de columna, comité de la AAOT.', 'Argentina', ARRAY['Multidisciplinar / Internacional']::text[], 'https://sapcv.com.ar'),
  ('Asociación Argentina de Ortopedia y Traumatología (AAOT)', 'Entidad matriz de la ortopedia argentina.', 'Argentina', ARRAY['Traumatología']::text[], 'https://aaot.org.ar'),
  ('Asociación Argentina para el Estudio del Dolor (AAED)', 'Primer capítulo IASP de Latinoamérica (1974); Congreso Argentino de Dolor bienal.', 'Argentina', ARRAY['Dolor / Anestesiología']::text[], 'https://aaedolor.org'),
  ('Sociedad Argentina de Reumatología (SAR)', 'Fundada en 1937.', 'Argentina', ARRAY['Reumatología']::text[], 'https://reumatologia.org.ar'),
  ('Sociedad Boliviana de Neurocirugía', 'No se identificó una sociedad de columna independiente; la neurocirugía cubre la subespecialidad.', 'Bolivia', ARRAY['Neurocirugía']::text[], 'https://sociedadbolivianadeneurocirugia.com'),
  ('Sociedade Brasileira de Coluna (SBC)', 'Reúne cirujanos de columna ortopedistas y neurocirujanos.', 'Brasil', ARRAY['Multidisciplinar / Internacional']::text[], 'https://coluna.com.br'),
  ('Sociedade Brasileira de Neurocirurgia — Depto. de Coluna (SBN)', 'Fundada en 1957; ~2.400 miembros, uno de los mayores del mundo en la especialidad.', 'Brasil', ARRAY['Neurocirugía']::text[], 'https://portalsbn.org'),
  ('Sociedade Brasileira de Ortopedia e Traumatologia (SBOT)', 'Fundada en 1935; certifica el título de especialista (TEOT).', 'Brasil', ARRAY['Traumatología']::text[], 'https://sbot.org.br'),
  ('Sociedade Brasileira para o Estudo da Dor (SBED)', 'Capítulo brasileño de la IASP, desde 1982.', 'Brasil', ARRAY['Dolor / Anestesiología']::text[], 'https://sbed.org.br'),
  ('Sociedad Chilena de Columna', 'Entidad nueva y multidisciplinar: neurocirugía, traumatología y medicina física.', 'Chile', ARRAY['Multidisciplinar / Internacional']::text[], 'https://sccolumna.cl'),
  ('Sociedad de Neurocirugía de Chile', 'Fundada en 1957 por el Dr. Alfonso Asenjo.', 'Chile', ARRAY['Neurocirugía']::text[], 'https://neurocirugiachile.org'),
  ('Sociedad Chilena de Ortopedia y Traumatología (SCHOT)', 'Entidad matriz de la ortopedia y traumatología chilena.', 'Chile', ARRAY['Traumatología']::text[], 'https://schot.org'),
  ('Asociación Chilena para el Estudio del Dolor y Cuidados Paliativos (ACHED-CP)', 'Fundada en 1989; capítulo chileno de la IASP desde 1993.', 'Chile', ARRAY['Dolor / Anestesiología']::text[], 'https://ached.cl'),
  ('Sociedad Chilena de Reumatología (SOCHIRE)', 'Fundada en 1950.', 'Chile', ARRAY['Reumatología']::text[], 'https://sochire.cl'),
  ('Asociación Colombiana de Neurocirugía (ACNCX)', 'Certifica a sus miembros activos como especialistas en columna; afiliada a FLANC y WFNS.', 'Colombia', ARRAY['Neurocirugía']::text[], 'https://acncx.org'),
  ('Asociación Colombiana para el Estudio del Dolor (ACED)', 'Capítulo IASP desde 1990.', 'Colombia', ARRAY['Dolor / Anestesiología']::text[], 'https://dolor.org.co'),
  ('Sociedad Colombiana de Anestesiología y Reanimación (S.C.A.R.E.)', 'Entidad matriz de la anestesiología colombiana, incluye dolor.', 'Colombia', ARRAY['Dolor / Anestesiología']::text[], 'https://scare.org.co'),
  ('Asociación Colombiana de Reumatología (Asoreuma)', 'Entidad matriz de la reumatología colombiana.', 'Colombia', ARRAY['Reumatología']::text[], 'https://asoreuma.org'),
  ('Sociedad Ecuatoriana de Neurocirugía (SENC)', 'Entidad matriz de la neurocirugía ecuatoriana.', 'Ecuador', ARRAY['Neurocirugía']::text[], 'https://senc.com.ec'),
  ('GEER — Sociedad Española de Columna Vertebral', 'Grupo de Estudio de Enfermedades del Raquis, desde 1981; principal foro español de patología espinal.', 'España', ARRAY['Multidisciplinar / Internacional']::text[], 'https://secolumnavertebral.org'),
  ('Sociedad Española de Cirugía Ortopédica y Traumatología (SECOT)', 'Fundada en 1947.', 'España', ARRAY['Traumatología']::text[], 'https://secot.es'),
  ('Sociedad Española del Dolor (SED)', 'Fundada en 1990.', 'España', ARRAY['Dolor / Anestesiología']::text[], 'https://sedolor.es'),
  ('Sociedad Española de Reumatología (SER)', 'Fundada en 1948; más de 2.300 profesionales.', 'España', ARRAY['Reumatología']::text[], 'https://ser.es'),
  ('AANS/CNS Section on Disorders of the Spine and Peripheral Nerves', 'Sección conjunta de columna de la AANS y el CNS.', 'Estados Unidos', ARRAY['Neurocirugía']::text[], 'https://spinesection.org'),
  ('American Academy of Orthopaedic Surgeons (AAOS)', 'Entidad matriz de la ortopedia estadounidense.', 'Estados Unidos', ARRAY['Traumatología']::text[], 'https://aaos.org'),
  ('American Society of Interventional Pain Physicians (ASIPP)', 'Fundada en 1998; ~4.000 miembros.', 'Estados Unidos', ARRAY['Dolor / Anestesiología']::text[], 'https://asipp.org'),
  ('ASRA Pain Medicine', 'Más de 5.000 miembros en 66 países; anestesia regional y dolor.', 'Estados Unidos', ARRAY['Dolor / Anestesiología']::text[], 'https://asra.com'),
  ('American Academy of Pain Medicine (AAPM)', 'Sociedad de medicina del dolor de Estados Unidos.', 'Estados Unidos', ARRAY['Dolor / Anestesiología']::text[], 'https://painmed.org'),
  ('Société Française de Neurochirurgie (SFNC)', 'Entidad matriz de la neurocirugía francesa.', 'Francia', ARRAY['Neurocirugía']::text[], 'https://sfneurochirurgie.fr'),
  ('Société Française de Chirurgie Rachidienne (SFCR)', 'Sin sitio oficial confirmado; presencia solo en Facebook.', 'Francia', ARRAY['Multidisciplinar / Internacional']::text[], 'https://facebook.com/SFCR'),
  ('Deutsche Wirbelsäulengesellschaft (DWG)', 'La mayor sociedad especializada de columna de Europa.', 'Alemania', ARRAY['Multidisciplinar / Internacional']::text[], 'https://dwg.org'),
  ('Asociación Mexicana de Cirujanos de Columna (AMCICO)', 'Sociedad nacional oficial de cirugía de columna; fundada en 1997.', 'México', ARRAY['Multidisciplinar / Internacional']::text[], 'https://amcico.com.mx'),
  ('Sociedad Mexicana de Cirugía Neurológica (SMCN)', 'Fundada en 1954.', 'México', ARRAY['Neurocirugía']::text[], 'https://smcn.org.mx'),
  ('Asociación Mexicana para el Estudio y Tratamiento del Dolor (AMETD)', 'Fundada en 1980, capítulo IASP desde 1993; sin sitio web propio confirmado, presencia en Instagram.', 'México', ARRAY['Dolor / Anestesiología']::text[], 'https://instagram.com/ametdac'),
  ('Sociedad Peruana de Neurocirugía (SPNC)', 'Única entidad que representa al país ante FLANC y WFNS.', 'Perú', ARRAY['Neurocirugía']::text[], 'https://spnc.pe'),
  ('Sociedad Peruana de Endoscopia Espinal (SPEES)', 'Única sociedad dedicada a la endoscopia de columna en el país.', 'Perú', ARRAY['Multidisciplinar / Internacional']::text[], 'https://spees.com.pe'),
  ('Sociedade Portuguesa de Patologia da Coluna Vertebral (SPPCV)', 'Fundada en 2003.', 'Portugal', ARRAY['Multidisciplinar / Internacional']::text[], 'https://sppcv.org'),
  ('Sociedade Portuguesa de Neurocirurgia (SPNC)', 'Entidad matriz de la neurocirugía portuguesa.', 'Portugal', ARRAY['Neurocirugía']::text[], 'https://spnc.pt'),
  ('British Association of Spine Surgeons (BASS)', 'Entidad matriz de la cirugía de columna en el Reino Unido.', 'Reino Unido', ARRAY['Multidisciplinar / Internacional']::text[], 'https://spinesurgeons.ac.uk'),
  ('British Pain Society', 'Fundada en 1967; la más antigua y grande del Reino Unido en dolor.', 'Reino Unido', ARRAY['Dolor / Anestesiología']::text[], 'https://britishpainsociety.org'),
  ('Sociedad Uruguaya de Neurocirugía (SUNC)', 'Entidad matriz de la neurocirugía uruguaya.', 'Uruguay', ARRAY['Neurocirugía']::text[], 'https://sunc.com.uy'),
  ('Sociedad Venezolana de Neurocirugía (SVNC)', 'Entidad matriz de la neurocirugía venezolana.', 'Venezuela', ARRAY['Neurocirugía']::text[], 'https://neurocirugiavenezuela.com');
