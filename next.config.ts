import type { NextConfig } from "next";

// Set NEXT_PUBLIC_BASE_PATH=/crm in production so the app can be reverse-proxied at
// www.bunyandigital.co/crm. Left unset locally so dev stays at the plain root.
const basePath = process.env.NEXT_PUBLIC_BASE_PATH || undefined;

const nextConfig: NextConfig = {
  basePath,
  experimental: {
    serverActions: {
      // Netlify's proxy layer can send an x-forwarded-host that doesn't match the
      // browser's Origin header, which Next.js's Server Action CSRF check rejects
      // by default. Explicitly trust the domains this app is actually served from.
      allowedOrigins: [
        "bunyandigitalcrm.netlify.app",
        "bunyandigital.co",
        "www.bunyandigital.co",
      ],
    },
  },
};

export default nextConfig;
