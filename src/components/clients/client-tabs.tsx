"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";

export function ClientTabs({ clientId, canManageBilling }: { clientId: string; canManageBilling: boolean }) {
  const pathname = usePathname();
  const base = `/clients/${clientId}`;
  const tabs = [
    { href: base, label: "Overview", exact: true },
    { href: `${base}/services`, label: "Services" },
    { href: `${base}/board`, label: "Board" },
    ...(canManageBilling ? [{ href: `${base}/billing`, label: "Billing", exact: false }] : []),
    { href: `${base}/activity`, label: "Activity" },
  ];

  return (
    <nav className="flex gap-5 border-b border-border px-4 md:px-6">
      {tabs.map((tab) => {
        const active = tab.exact ? pathname === tab.href : pathname.startsWith(tab.href);
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              "relative py-3 text-sm transition-colors",
              active ? "font-medium text-foreground" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {tab.label}
            {active ? (
              <span className="absolute inset-x-0 -bottom-px h-[2px] bg-primary" />
            ) : null}
          </Link>
        );
      })}
    </nav>
  );
}
