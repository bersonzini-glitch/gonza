import type { NextConfig } from "next";

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

export default nextConfig;
