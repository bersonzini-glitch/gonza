import { ImageResponse } from "next/og";

// Generic branded image used as the fallback `og:image` for pages without
// their own photo, and as the `image` field in Event structured data (see
// src/app/[locale]/events/[slug]/page.tsx) — Google's Event rich-result
// validator flags a missing `image` otherwise, and events don't have their
// own uploaded photos the way surgeon profiles do.
export async function GET() {
  const image = new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          // Satori (the ImageResponse renderer) can't parse oklch() — these
          // are the sRGB equivalents of the site's light-theme tokens.
          background: "#faf8f5",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
          <div
            style={{
              display: "flex",
              width: 88,
              height: 88,
              alignItems: "center",
              justifyContent: "center",
              borderRadius: 20,
              background: "#005358",
            }}
          >
            <svg
              width="48"
              height="48"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#faf8f5"
              strokeWidth="1.6"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M22 17h-3" />
              <path d="M22 7h-5" />
              <path d="M5 17H2" />
              <path d="M7 7H2" />
              <rect x="5" y="14" width="14" height="6" rx="2" />
              <rect x="7" y="4" width="10" height="6" rx="2" />
            </svg>
          </div>
          <div style={{ display: "flex", fontSize: 72, fontWeight: 600, color: "#26282e" }}>
            Columna<span style={{ color: "#005358" }}>LATAM</span>
          </div>
        </div>
        <div style={{ display: "flex", marginTop: 28, fontSize: 30, color: "#6b7078" }}>
          Congresos de cirugía de columna en Latinoamérica
        </div>
      </div>
    ),
    { width: 1200, height: 630 },
  );
  image.headers.set("Cache-Control", "public, max-age=86400, s-maxage=31536000, immutable");
  return image;
}
