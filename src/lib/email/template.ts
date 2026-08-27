const BRAND_BG = "#fbfaf6";
const CARD_BORDER = "#ece9e1";
const TEXT_DARK = "#1b2026";
const TEXT_BODY = "#535c66";
const TEXT_MUTED = "#a3a9b3";
const ACCENT = "#005358";
const SERIF = "Georgia,'Times New Roman',serif";
const SANS = "Helvetica,Arial,sans-serif";

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

/** Wraps `bodyHtml` in the same header/card/footer shell used by the customized Supabase auth email templates. */
export function renderBrandedEmailHtml({
  heading,
  bodyHtml,
}: {
  heading: string;
  bodyHtml: string;
}): string {
  return `<div style="background-color:${BRAND_BG};padding:40px 20px;font-family:${SANS};">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:480px;margin:0 auto;">
<tr><td style="padding-bottom:28px;text-align:center;">
<span style="font-family:${SERIF};font-size:20px;font-weight:700;color:${TEXT_DARK};">Columna<span style="color:${ACCENT};">LATAM</span></span>
</td></tr>
<tr><td style="background-color:#ffffff;border:1px solid ${CARD_BORDER};border-radius:16px;padding:40px 32px;">
<h1 style="font-family:${SERIF};font-size:24px;font-weight:700;color:${TEXT_DARK};margin:0 0 16px;">${escapeHtml(heading)}</h1>
${bodyHtml}
</td></tr>
<tr><td style="padding-top:24px;text-align:center;">
<p style="font-family:${SANS};font-size:12px;color:${TEXT_MUTED};margin:0;">ColumnaLATAM · Directorio de congresos y cirujanos de columna en Latinoamérica</p>
</td></tr>
</table>
</div>`;
}
