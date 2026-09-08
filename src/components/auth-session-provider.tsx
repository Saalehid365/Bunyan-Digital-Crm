"use client";

import { SessionProvider } from "next-auth/react";
import { BASE_PATH } from "@/lib/base-path";

// next-auth/react's client functions (signOut, etc.) resolve their API base path from
// a legacy NEXTAUTH_URL env var we don't set (we use AUTH_URL, the v5 name) — without this,
// they silently target the wrong (unprefixed) URL under a basePath deployment.
export function AuthSessionProvider({ children }: { children: React.ReactNode }) {
  return <SessionProvider basePath={`${BASE_PATH}/api/auth`}>{children}</SessionProvider>;
}
