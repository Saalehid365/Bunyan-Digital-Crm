"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { BASE_PATH } from "@/lib/base-path";
import type { NewPortalActivity, NewPortalActivities } from "@/lib/portal-activity";

const POLL_MS = 20_000;

/**
 * Renders nothing. While the tab is open and visible, polls for client-submitted portal
 * details (brand kit saved, a file added, a login shared) and pops a toast for each one
 * not seen yet — mirrors RevenueFinderLiveAlerts' same polling pattern.
 */
export function PortalActivityLiveAlerts({ initial }: { initial: NewPortalActivity[] }) {
  const router = useRouter();
  const seen = useRef(new Set(initial.map((a) => a.id)));

  useEffect(() => {
    let stopped = false;

    async function check() {
      if (document.hidden) return;
      try {
        const res = await fetch(`${BASE_PATH}/api/portal-activity/new`, { cache: "no-store" });
        if (!res.ok || stopped) return;
        const data = (await res.json()) as NewPortalActivities;
        const fresh = data.items.filter((a) => !seen.current.has(a.id));
        if (fresh.length === 0) return;
        fresh.forEach((a) => seen.current.add(a.id));
        [...fresh].reverse().forEach((a) =>
          toast.success(`${a.clientName} sent details`, {
            description: a.message,
            duration: 15_000,
            action: { label: "View", onClick: () => router.push(`/clients/${a.clientId}/portal`) },
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
