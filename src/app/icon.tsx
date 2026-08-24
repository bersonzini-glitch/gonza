import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

// Mirrors the header logo badge (size-8, rounded-lg, bg-primary) at 1:1
// scale, so the browser tab icon matches the in-app brand mark exactly.
export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          // Satori (the ImageResponse renderer) can't parse oklch() — this
          // is the sRGB equivalent of the site's --primary token.
          background: "#005358",
          borderRadius: 8,
        }}
      >
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#faf8f5"
          strokeWidth="2"
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
    ),
    { ...size },
  );
}
