"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { BASE_PATH } from "@/lib/base-path";
import type { NewApplication, NewApplications } from "@/lib/revenue-finder-alerts";

const POLL_MS = 20_000;

/**
 * Admin-only, renders nothing. While the tab is open and visible it checks for new
 * Revenue Finder applications and pops a toast for each one it hasn't seen, then refreshes
 * the server data so the bell and the sidebar badge update without a reload.
 */
export function RevenueFinderLiveAlerts({ initial }: { initial: NewApplication[] }) {
  const router = useRouter();
  const seen = useRef(new Set(initial.map((a) => a.id)));

  useEffect(() => {
    let stopped = false;

    async function check() {
      if (document.hidden) return;
      try {
        const res = await fetch(`${BASE_PATH}/api/revenue-finder/new`, { cache: "no-store" });
        if (!res.ok || stopped) return;
        const data = (await res.json()) as NewApplications;
        const fresh = data.items.filter((a) => !seen.current.has(a.id));
        if (fresh.length === 0) return;
        fresh.forEach((a) => seen.current.add(a.id));
        // Oldest first so the newest ends up on top of the stack.
        [...fresh].reverse().forEach((a) =>
          toast.success("New Revenue Finder application", {
            description: `${a.name} · ${a.storeUrl.replace(/^https?:\/\//, "")}`,
            duration: 15_000,
            action: { label: "View", onClick: () => router.push("/revenue-finder") },
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
