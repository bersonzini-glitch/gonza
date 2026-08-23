-- Enumerated types used for data integrity across the schema.

create type public.profile_role as enum ('user', 'admin');

create type public.surgeon_status as enum (
  'draft',
  'submitted',
  'approved',
  'rejected',
  'suspended'
);

create type public.primary_specialty as enum (
  'orthopedic_spine_surgeon',
  'neurosurgeon_spine'
);

create type public.consultation_format as enum (
  'in_person',
  'telemedicine',
  'both'
);

create type public.event_type as enum (
  'congress',
  'conference',
  'course',
  'workshop',
  'webinar'
);

create type public.event_format as enum (
  'in_person',
  'hybrid',
  'online'
);

create type public.event_status as enum (
  'pending',
  'approved',
  'rejected'
);

create type public.event_source_type as enum (
  'official_society',
  'hospital',
  'university',
  'organizer',
  'rss',
  'public_api',
  'other'
);
