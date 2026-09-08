import type { NextConfig } from "next";

// Set NEXT_BASE_PATH=/crm in production (Vercel) so the app can be reverse-proxied
// at www.bunyandigital.co/crm. Left unset locally so dev stays at the plain root.
const basePath = process.env.NEXT_BASE_PATH || undefined;

const nextConfig: NextConfig = {
  basePath,
};

export default nextConfig;
