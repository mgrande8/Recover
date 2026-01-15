import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable static export for Capacitor builds
  // Note: Set output: 'export' only when building for Capacitor
  // output: process.env.CAPACITOR_BUILD ? 'export' : undefined,

  // Image optimization needs to be disabled for static export
  images: {
    unoptimized: process.env.CAPACITOR_BUILD === 'true',
  },
};

export default nextConfig;
