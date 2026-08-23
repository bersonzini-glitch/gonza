// Canonical option lists shared by search filters, forms, and the seed
// dataset. Subspecialty tags and event topics are free text at the database
// layer (see supabase/migrations/20260822000500_surgeon_specialties_locations.sql
// and .../20260822000600_events.sql) so the list can grow without a
// migration; this module is the single place that vocabulary is curated.

export const LATAM_COUNTRIES = [
  "Argentina",
  "Bolivia",
  "Brazil",
  "Chile",
  "Colombia",
  "Costa Rica",
  "Cuba",
  "Dominican Republic",
  "Ecuador",
  "El Salvador",
  "Guatemala",
  "Honduras",
  "Mexico",
  "Nicaragua",
  "Panama",
  "Paraguay",
  "Peru",
  "Uruguay",
  "Venezuela",
] as const;

export const SUBSPECIALTY_SUGGESTIONS = [
  "Degenerative Spine",
  "Spinal Deformity",
  "Spinal Trauma",
  "Minimally Invasive Surgery",
  "Spine Tumor / Oncology",
  "Pediatric Spine",
  "Revision Spine Surgery",
  "Spine Infection",
  "Sports Spine",
  "Robotics & Navigation",
  "Endoscopic Spine Surgery",
  "Cervical Spine",
  "Lumbar Spine",
  "Scoliosis",
] as const;

export const LANGUAGE_SUGGESTIONS = [
  "Spanish",
  "Portuguese",
  "English",
  "French",
  "Italian",
  "German",
] as const;

export const EVENT_TOPIC_SUGGESTIONS = [
  "Spinal Surgery",
  "Neurosurgery",
  "Orthopedics",
  "Minimally Invasive Surgery",
  "Deformity",
  "Trauma",
  "Degenerative Spine",
  "Pediatric Spine",
  "Spine Tumor / Oncology",
  "Endoscopic Spine Surgery",
  "Robotics & Navigation",
] as const;
