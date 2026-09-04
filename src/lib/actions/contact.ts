"use server";

import { headers } from "next/headers";
import { getTranslations } from "next-intl/server";
import { Resend } from "resend";

import { checkRateLimit } from "@/lib/rate-limit";
import { createClient } from "@/lib/supabase/server";
import { verifyTurnstileToken } from "@/lib/turnstile";
import { makeContactSchema } from "@/lib/validation/contact";

export interface ContactActionState {
  error?: string;
  success?: string;
}

async function getClientIp(): Promise<string> {
  const h = await headers();
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
}

export async function sendContactMessageAction(
  locale: string,
  _prevState: ContactActionState,
  formData: FormData,
): Promise<ContactActionState> {
  const [tValidation, tErrors] = await Promise.all([
    getTranslations({ locale, namespace: "contactValidation" }),
    getTranslations({ locale, namespace: "contactErrors" }),
  ]);

  const parsed = makeContactSchema(tValidation).safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    message: formData.get("message"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? tErrors("invalidData") };
  }

  const supabase = await createClient();
  const ip = await getClientIp();

  const allowed = await checkRateLimit(supabase, ip, "contact-form", 5, 60 * 15);
  if (!allowed) {
    return { error: tErrors("tooManyAttempts") };
  }

  const captchaValid = await verifyTurnstileToken(
    formData.get("cf-turnstile-response") as string | null,
    ip,
  );
  if (!captchaValid) {
    return { error: tErrors("captchaFailed") };
  }

  const apiKey = process.env.RESEND_API_KEY;
  const toEmail = process.env.CONTACT_FORM_TO_EMAIL;
  if (!apiKey || !toEmail) {
    console.error(
      "Contact form is not configured: missing RESEND_API_KEY or CONTACT_FORM_TO_EMAIL.",
    );
    return { error: tErrors("notConfigured") };
  }

  const { name, email, message } = parsed.data;

  try {
    // Sent from Resend's shared test domain rather than a columnalatam.org
    // address — sending from your own domain needs it verified in Resend
    // first. replyTo carries the submitter's address so replying from your
    // inbox goes straight back to them.
    const resend = new Resend(apiKey);
    const { error } = await resend.emails.send({
      from: "ColumnaLATAM <onboarding@resend.dev>",
      to: toEmail,
      replyTo: email,
      subject: "Mensaje desde columnalatam.org",
      text: `Nombre: ${name}\nEmail: ${email}\n\n${message}`,
    });

    if (error) {
      console.error("Resend failed to send contact message:", error);
      return { error: tErrors("sendFailed") };
    }
  } catch (err) {
    console.error("sendContactMessageAction failed unexpectedly:", err);
    return { error: tErrors("sendFailed") };
  }

  return { success: tErrors("sent") };
}
