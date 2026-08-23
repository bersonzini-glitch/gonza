# Seed data

Run with `npm run seed` (requires `SUPABASE_SERVICE_ROLE_KEY` in `.env.local`). Safe to re-run — everything is upserted by a stable slug/email, never duplicated.

## `events.json`

Seven real, source-verified LATAM spine-related congresses/courses, checked on **2026-08-22** against each event's official page (see each entry's `sources`). Where an official page didn't itself surface exact dates and a secondary source was needed, or where a general orthopedics congress was included because the society runs a standing spine committee, that's noted in the event's `dateNote`. No event, date, organizer, or URL in this file was invented — every entry traces to a real page that was fetched during research, and events that couldn't be confirmed with a real primary or credible secondary source were left out rather than guessed. This is intentionally a small, high-confidence starting set; extend it the same way (real source → structured entry → `event_sources` row), not by filling in plausible-sounding events.

## `demo-surgeons.json`

Eight **clearly fictional** sample surgeon profiles (`is_demo: true`, names suffixed "(Demo)", emails on the reserved `.example` domain per RFC 2606) used to populate the directory UI before real surgeons register. They render with a visible "Sample profile" badge everywhere they appear and are excluded from the "verified" badge shown to real approved profiles. Replace or remove them once enough real, admin-approved submissions exist — they are not real people and must never be presented as such.
