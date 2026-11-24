"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { BASE_PATH } from "@/lib/base-path";
import type { NewPortalNotification, NewPortalNotifications } from "@/lib/portal-notifications";

const POLL_MS = 20_000;

const HEADING: Record<NewPortalNotification["kind"], string> = {
  DOCUMENT: "New document",
  PRODUCT: "Product update",
  MESSAGE: "New message",
  OVERVIEW: "New update",
};

/**
 * Renders nothing. While the client has the portal open, polls for anything the team's
 * just sent — a document, a product update, a message, a new result/campaign/report —
 * and pops a toast for each one not seen yet. Mirrors PortalActivityLiveAlerts, just for
 * the other direction.
 */
export function PortalLiveAlerts({ initial }: { initial: NewPortalNotification[] }) {
  const router = useRouter();
  const seen = useRef(new Set(initial.map((n) => n.id)));

  useEffect(() => {
    let stopped = false;

    async function check() {
      if (document.hidden) return;
      try {
        const res = await fetch(`${BASE_PATH}/api/portal-notifications/new`, { cache: "no-store" });
        if (!res.ok || stopped) return;
        const data = (await res.json()) as NewPortalNotifications;
        const fresh = data.items.filter((n) => !seen.current.has(n.id));
        if (fresh.length === 0) return;
        fresh.forEach((n) => seen.current.add(n.id));
        [...fresh].reverse().forEach((n) =>
          toast.success(HEADING[n.kind], {
            description: n.message,
            duration: 15_000,
            action: { label: "View", onClick: () => router.push(n.ctaPath) },
          }),
        );
        router.refresh();
      } catch {
        // Offline or a transient error — the next tick tries again.
      }
    }

    const timer = setInterval(check, POLL_MS);
    document.addEventListener("visibilitychange", check);
    return () => {
      stopped = true;
      clearInterval(timer);
      document.removeEventListener("visibilitychange", check);
    };
  }, [router]);

  return null;
}
