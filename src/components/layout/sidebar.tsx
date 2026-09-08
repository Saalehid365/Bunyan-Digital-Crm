"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  KanbanSquare,
  UsersRound,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";

type NavItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  adminOnly?: boolean;
};

const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/clients", label: "Clients", icon: Users },
  { href: "/board", label: "Board", icon: KanbanSquare },
  { href: "/team", label: "Team", icon: UsersRound, adminOnly: true },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function Sidebar({ role }: { role: "ADMIN" | "MEMBER" }) {
  const pathname = usePathname();

  return (
    <aside className="hidden w-60 shrink-0 flex-col border-r border-sidebar-border bg-sidebar md:flex">
      <div className="flex h-14 items-center gap-2.5 border-b border-sidebar-border px-5">
        <div className="flex h-7 w-7 items-center justify-center rounded-[var(--radius-sm)] border border-primary/40 bg-primary/10 text-primary">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
            <path d="M3 21h18M5 21V7l7-4 7 4v14M9 21v-6h6v6" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <span className="text-sm font-semibold tracking-tight text-sidebar-foreground">
          Bunyan Digital
        </span>
      </div>

      <nav className="flex-1 space-y-0.5 px-2 py-4">
        {NAV_ITEMS.filter((item) => !item.adminOnly || role === "ADMIN").map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + "/");
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "group relative flex items-center gap-2.5 rounded-[var(--radius-sm)] px-3 py-2 text-sm transition-colors",
                active
                  ? "bg-sidebar-accent text-sidebar-foreground font-medium"
                  : "text-muted-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-foreground",
              )}
            >
              <span
                className={cn(
                  "absolute left-0 top-1/2 h-4 w-[2px] -translate-y-1/2 rounded-full bg-primary transition-opacity",
                  active ? "opacity-100" : "opacity-0",
                )}
              />
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-sidebar-border px-3 py-3">
        <p className="px-2 text-[11px] leading-relaxed text-muted-foreground">
          Bunyan Digital Ltd
        </p>
      </div>
    </aside>
  );
}
