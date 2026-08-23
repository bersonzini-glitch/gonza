import { AlertTriangle } from "lucide-react";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privacy & Medical Disclaimer",
  description: "Privacy practices and the medical disclaimer for ColumnaLATAM.",
};

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
      <h1 className="font-heading text-3xl font-semibold text-foreground sm:text-4xl">
        Privacy & medical disclaimer
      </h1>

      <div className="mt-6 flex gap-3 rounded-xl border border-destructive/30 bg-destructive/5 p-5">
        <AlertTriangle className="size-5 shrink-0 text-destructive" aria-hidden="true" />
        <div className="text-sm text-foreground">
          <p className="font-semibold">This is not a medical emergency service.</p>
          <p className="mt-1 text-muted-foreground">
            If you are experiencing a medical emergency, contact your local emergency services
            immediately. Do not use this website to seek urgent or emergency care.
          </p>
        </div>
      </div>

      <section className="mt-10 space-y-3">
        <h2 className="font-heading text-xl font-semibold text-foreground">Medical disclaimer</h2>
        <p className="text-muted-foreground">
          ColumnaLATAM is an informational directory only. It does not provide medical advice,
          diagnosis, or treatment, and listing a surgeon does not constitute an endorsement or
          guarantee of their qualifications, availability, or fitness for any particular case.
          Congress and event information is provided for discovery purposes and may change without
          notice — always confirm dates, format, and registration details directly with the event
          organizer before making travel or attendance plans.
        </p>
        <p className="text-muted-foreground">
          Always independently verify a surgeon&rsquo;s license, credentials, and current practice
          status with the relevant medical board or institution, and consult directly with a
          qualified healthcare professional before making any decision about your care.
        </p>
      </section>

      <section className="mt-10 space-y-3">
        <h2 className="font-heading text-xl font-semibold text-foreground">What we collect</h2>
        <ul className="list-disc space-y-2 pl-5 text-muted-foreground">
          <li>
            <strong>Account data:</strong> your email, username, and full name, managed by Supabase
            Auth, used to authenticate you and let you manage your own submissions.
          </li>
          <li>
            <strong>Surgeon profile data:</strong> the information you choose to submit (biography,
            affiliations, languages, contact links, and an optional photo). This stays private
            (draft/submitted) until an administrator approves it for public display.
          </li>
          <li>
            <strong>Basic technical data:</strong> IP address and timestamps used only for abuse
            protection (rate limiting sign-up, sign-in, and submission endpoints) and are not sold
            or shared with third parties.
          </li>
        </ul>
      </section>

      <section className="mt-10 space-y-3">
        <h2 className="font-heading text-xl font-semibold text-foreground">How we protect it</h2>
        <p className="text-muted-foreground">
          Passwords are handled entirely by Supabase Auth and are never stored in plaintext or seen
          by our application code. Database access is governed by Row Level Security policies, so
          your draft or submitted profile is not readable by other users, and only administrators
          can review it prior to approval. You can request deletion of your account and profile at
          any time from your dashboard, or by contacting an administrator.
        </p>
      </section>

      <section className="mt-10 space-y-3">
        <h2 className="font-heading text-xl font-semibold text-foreground">Your choices</h2>
        <p className="text-muted-foreground">
          You control what appears on your public surgeon profile before submitting it for review,
          and can edit it again if it is returned to draft. You may withdraw your profile from the
          directory at any time by contacting an administrator.
        </p>
      </section>
    </div>
  );
}
