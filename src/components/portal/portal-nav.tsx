"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { portalSignOut } from "@/server/actions/portal-session";

const TABS = [
  { href: "/portal", label: "Overview", exact: true, badgeKey: null },
  { href: "/portal/documents", label: "Documents", exact: false, badgeKey: "documents" },
  { href: "/portal/brand", label: "Brand", exact: false, badgeKey: null },
  { href: "/portal/messages", label: "Messages", exact: false, badgeKey: "messages" },
] as const;

export function PortalNav({
  clientName,
  unreadMessages,
  pendingDocuments,
}: {
  clientName: string;
  unreadMessages: number;
  pendingDocuments: number;
}) {
  const pathname = usePathname();
  const badgeCounts: Record<string, number> = { messages: unreadMessages, documents: pendingDocuments };

  return (
    <div className="flex items-center gap-5">
      <nav className="flex items-center gap-5 text-sm">
        {TABS.map((tab) => {
          const active = tab.exact ? pathname === tab.href : pathname.startsWith(tab.href);
          const count = tab.badgeKey ? badgeCounts[tab.badgeKey] : 0;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                "relative flex items-center gap-1.5 py-1 transition-colors",
                active ? "font-medium text-foreground" : "text-muted-foreground hover:text-foreground",
              )}
            >
              {tab.label}
              {count > 0 ? (
                <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-semibold text-primary-foreground">
                  {count > 9 ? "9+" : count}
                </span>
              ) : null}
            </Link>
          );
        })}
      </nav>
      <span className="hidden text-xs text-muted-foreground md:inline">{clientName}</span>
      <form action={portalSignOut}>
        <button
          type="submit"
          className="flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
          aria-label="Sign out"
        >
          <LogOut className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Sign out</span>
        </button>
      </form>
    </div>
  );
}
