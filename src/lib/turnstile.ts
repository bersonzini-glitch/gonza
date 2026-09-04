import "server-only";

interface TurnstileVerifyResponse {
  success: boolean;
  [key: string]: unknown;
}

/**
 * Verifies a Cloudflare Turnstile token server-side against the siteverify
 * API. Returns true when no TURNSTILE_SECRET_KEY is configured, so forms
 * degrade gracefully instead of blocking every submission before the admin
 * sets up real keys — IP rate limiting still applies as a fallback.
 */
export async function verifyTurnstileToken(
  token: string | null,
  remoteIp: string,
): Promise<boolean> {
  const secretKey = process.env.TURNSTILE_SECRET_KEY;
  if (!secretKey) return true;
  if (!token) return false;

  try {
    const response = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ secret: secretKey, response: token, remoteip: remoteIp }),
    });
    const data = (await response.json()) as TurnstileVerifyResponse;
    return data.success === true;
  } catch (err) {
    console.error("Turnstile verification request failed:", err);
    return false;
  }
}
