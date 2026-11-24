"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { markPortalTabRead } from "@/server/actions/portal-actions";
import type { PortalNotificationKind } from "@prisma/client";

/** Renders nothing. Marks this tab's badge as seen once, then refreshes so the nav badge
 * (computed in the parent layout) clears without waiting for the next navigation — same
 * fix as the team-side Portal tab badge needed. */
export function MarkNotificationsRead({ kind }: { kind: PortalNotificationKind }) {
  const router = useRouter();
  const done = useRef(false);

  useEffect(() => {
    if (done.current) return;
    done.current = true;
    markPortalTabRead(kind).then(() => router.refresh());
  }, [kind, router]);

  return null;
}
