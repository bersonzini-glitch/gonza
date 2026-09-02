const BRAND_BG = "#fbfaf6";
const CARD_BORDER = "#ece9e1";
const TEXT_DARK = "#1b2026";
const TEXT_BODY = "#535c66";
const TEXT_MUTED = "#a3a9b3";
const ACCENT = "#005358";
const SERIF = "Georgia,'Times New Roman',serif";
const SANS = "Helvetica,Arial,sans-serif";
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

function escapeHtml(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Splits on blank lines into <p> blocks, matching the body-copy style of the branded Supabase auth emails. */
export function textToParagraphsHtml(text: string): string {
  return text
    .split(/\n{2,}/)
    .map((block) => block.trim())
    .filter(Boolean)
    .map(
      (block) =>
        `<p style="font-family:${SANS};font-size:15px;line-height:1.6;color:${TEXT_BODY};margin:0 0 16px;">${escapeHtml(
          block,
        ).replace(/\n/g, "<br>")}</p>`,
    )
    .join("");
}

/**
 * Wraps `bodyHtml` in the same header/card/footer shell used by the
 * customized Supabase auth email templates — but as a full HTML document,
 * unlike the Supabase editor field (which only holds the inner fragment;
 * Supabase's own send pipeline supplies the surrounding document). Without
 * that wrapper, Gmail and other clients treat the mail as a bare fragment
 * and apply their own auto-dark-mode recoloring, which overrides the card's
 * white background and strips the layout down to plain stacked text. The
 * `color-scheme`/`supported-color-schemes` meta tags opt the email out of
 * that recoloring; the `bgcolor` attributes are a belt-and-suspenders
 * fallback for older clients that ignore those meta tags but still honor
 * the legacy HTML attribute over CSS `background-color`.
 */
export function renderBrandedEmailHtml({
  heading,
  bodyHtml,
  ctaButton,
}: {
  heading: string;
  bodyHtml: string;
  ctaButton?: { label: string; url: string };
}): string {
  const ctaHtml = ctaButton
    ? `<div style="text-align:center;margin:8px 0 20px;">
<a href="${escapeHtml(ctaButton.url)}" style="display:inline-block;background-color:${ACCENT};color:#ffffff;font-family:${SANS};font-size:14px;font-weight:700;text-decoration:none;padding:12px 28px;border-radius:8px;">${escapeHtml(ctaButton.label)}</a>
</div>`
    : "";
  return `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="color-scheme" content="light">
<meta name="supported-color-schemes" content="light">
<title>${escapeHtml(heading)}</title>
</head>
<body style="margin:0;padding:0;background-color:${BRAND_BG};">
<div style="background-color:${BRAND_BG};padding:40px 20px;font-family:${SANS};">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;margin:0 auto;">
<tr><td style="padding-bottom:28px;text-align:center;">
<a href="${SITE_URL}" style="font-family:${SERIF};font-size:20px;font-weight:700;color:${TEXT_DARK};text-decoration:none;">Columna<span style="color:${ACCENT};">LATAM</span></a>
</td></tr>
<tr><td bgcolor="#ffffff" style="background-color:#ffffff;border:1px solid ${CARD_BORDER};border-radius:16px;padding:40px 32px;">
<h1 style="font-family:${SERIF};font-size:24px;font-weight:700;color:${TEXT_DARK};margin:0 0 16px;">${escapeHtml(heading)}</h1>
${bodyHtml}
${ctaHtml}
</td></tr>
<tr><td style="padding-top:24px;text-align:center;">
<p style="font-family:${SANS};font-size:12px;color:${TEXT_MUTED};margin:0;">ColumnaLATAM · Directorio de congresos y cirujanos de columna en Latinoamérica</p>
</td></tr>
</table>
</div>
</body>
</html>`;
}
