import { BookOpenCheck, Database, ShieldCheck, Users } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About & Data Sources",
  description:
    "How ColumnaLATAM sources spine congress data and verifies spine surgeon profiles across Latin America.",
};

export default function AboutPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="font-heading text-3xl font-semibold text-foreground sm:text-4xl">
        About ColumnaLATAM
      </h1>
      <p className="mt-4 text-lg text-muted-foreground">
        ColumnaLATAM is an independent, editorial directory of spine surgery congresses and verified
        spine surgeons across Latin America. We built it because information about regional spine
        events and specialists is scattered across dozens of society websites, hospital pages, and
        social feeds — we bring it into one trustworthy place.
      </p>

      <section className="mt-12">
        <h2 className="flex items-center gap-2 font-heading text-xl font-semibold text-foreground">
          <Database className="size-5 text-primary" aria-hidden="true" />
          Congress data methodology
        </h2>
        <div className="mt-3 space-y-3 text-muted-foreground">
          <p>
            Every congress, conference, course, workshop, or webinar listed here is sourced from a
            real, public origin — an official society page, a hospital or university CME calendar,
            an event organizer&rsquo;s own site, or a public RSS/open API feed. We do not fabricate
            events, dates, organizers, or URLs.
          </p>
          <p>
            Each event page lists its data source(s) and a &ldquo;last verified&rdquo; date. When a
            source only publishes a month/year, or says an event is annual with dates not yet
            announced, we say so explicitly (via a date note) rather than inventing a specific day.
          </p>
          <p>
            The event pipeline is intentionally simple and auditable: admins add and periodically
            re-verify events through the admin dashboard, and every event links back to at least one
            source URL you can check yourself. We do not scrape sites that prohibit it, bypass
            access controls, or generate abusive request volume against any source.
          </p>
        </div>
      </section>

      <section className="mt-12">
        <h2 className="flex items-center gap-2 font-heading text-xl font-semibold text-foreground">
          <Users className="size-5 text-primary" aria-hidden="true" />
          Surgeon directory & verification
        </h2>
        <div className="mt-3 space-y-3 text-muted-foreground">
          <p>
            Surgeons create their own account and submit their profile. A profile is{" "}
            <strong>never publicly visible</strong> until an administrator reviews and approves it —
            draft and submitted profiles are only visible to their owner and to admins.
          </p>
          <p>
            We do not invent surgeon identities, qualifications, license numbers, contact details,
            or photos. Any demo/sample profiles used to illustrate the directory before real
            submissions are onboarded are clearly labeled &ldquo;Sample profile&rdquo; everywhere
            they appear, including on their own page.
          </p>
          <p>
            A &ldquo;verified&rdquo; badge means the profile passed our review process for
            completeness and internal consistency — it is not a substitute for independently
            confirming a surgeon&rsquo;s license and credentials with their local medical board or
            institution before making any care decision.
          </p>
        </div>
      </section>

      <section className="mt-12">
        <h2 className="flex items-center gap-2 font-heading text-xl font-semibold text-foreground">
          <ShieldCheck className="size-5 text-primary" aria-hidden="true" />
          Security & data handling
        </h2>
        <div className="mt-3 space-y-3 text-muted-foreground">
          <p>
            Authentication, password storage, and session handling are delegated entirely to
            Supabase Auth — we never see or store plaintext passwords. Every table is protected by
            Row Level Security so that, regardless of application bugs, the database itself enforces
            who can read or write which rows.
          </p>
          <p>
            Sensitive administrative actions (approving, rejecting, suspending, or deleting a
            profile; creating or editing events) are written to an append-only audit log that no
            role, including admins, can edit or delete through the application.
          </p>
        </div>
      </section>

      <section className="mt-12">
        <h2 className="flex items-center gap-2 font-heading text-xl font-semibold text-foreground">
          <BookOpenCheck className="size-5 text-primary" aria-hidden="true" />
          Corrections
        </h2>
        <p className="mt-3 text-muted-foreground">
          Spot an error in an event listing or a surgeon profile? Sign in and use your dashboard to
          request changes to your own profile, or reach out through the contact details published on
          the relevant event&rsquo;s official website to have us correct event information.
        </p>
      </section>
    </div>
  );
}
