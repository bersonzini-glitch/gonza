import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const nextConfig: NextConfig = {
  experimental: {
    // Server Actions default to a 1 MB request body limit, which rejects
    // real phone photos well under our own 5 MB upload limit (see
    // MAX_BYTES in photo-upload.tsx) before the action even runs.
    serverActions: {
      bodySizeLimit: "6mb",
    },
  },
};

export default withNextIntl(nextConfig);
