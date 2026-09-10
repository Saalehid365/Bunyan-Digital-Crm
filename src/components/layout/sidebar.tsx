"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "motion/react";
import {
  LayoutDashboard,
  Users,
  KanbanSquare,
  Clock,
  BarChart3,
  UsersRound,
  Settings,
  Receipt,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { Permission } from "@prisma/client";

type NavItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  /** Hard admin-only, unrelated to the grantable Permission set (e.g. managing the
   * team itself is more sensitive than any one capability). */
  adminOnly?: boolean;
  /** Visible to ADMIN always, or a MEMBER holding this specific permission. */
  permission?: Permission;
};

export const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/clients", label: "Clients", icon: Users },
  { href: "/board", label: "Jobs", icon: KanbanSquare },
  { href: "/timesheets", label: "Timesheets", icon: Clock },
  { href: "/invoices", label: "Quotes & Invoices", icon: Receipt, permission: "MANAGE_BILLING" },
  { href: "/reports", label: "Reports", icon: BarChart3, permission: "VIEW_REPORTS" },
  { href: "/team", label: "Team", icon: UsersRound, adminOnly: true },
  { href: "/settings", label: "Settings", icon: Settings },
];

export function SidebarBrand() {
  return (
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
  );
}

export function SidebarNav({
  role,
  permissions = [],
  onNavigate,
}: {
  role: "ADMIN" | "MEMBER";
  permissions?: Permission[];
  onNavigate?: () => void;
}) {
  const pathname = usePathname();
  const isAdmin = role === "ADMIN";
  const visibleItems = NAV_ITEMS.filter((item) => {
    if (item.adminOnly) return isAdmin;
    if (item.permission) return isAdmin || permissions.includes(item.permission);
    return true;
  });

  return (
    <nav className="flex-1 space-y-0.5 px-2 py-4">
      {visibleItems.map((item) => {
        const active = pathname === item.href || pathname.startsWith(item.href + "/");
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            className={cn(
              "group relative flex items-center gap-2.5 rounded-[var(--radius-md)] px-3 py-2 text-sm transition-colors duration-150",
              active ? "text-sidebar-foreground font-medium" : "text-muted-foreground hover:text-sidebar-foreground",
            )}
          >
            {active ? (
              <motion.span
                layoutId="sidebar-active-pill"
                className="absolute inset-0 rounded-[var(--radius-md)] border border-primary/25 bg-primary/10 shadow-[0_1px_2px_rgba(0,0,0,0.04),0_2px_8px_-2px_rgba(0,0,0,0.08)]"
                transition={{ type: "spring", stiffness: 500, damping: 40 }}
              />
            ) : (
              <span className="absolute inset-0 rounded-[var(--radius-md)] opacity-0 transition-opacity duration-150 group-hover:opacity-100 group-hover:bg-sidebar-accent/60" />
            )}
            <Icon className={cn("relative h-4 w-4", active && "text-primary")} />
            <span className="relative">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}

export function Sidebar({ role, permissions }: { role: "ADMIN" | "MEMBER"; permissions: Permission[] }) {
  return (
    <aside className="rise hidden w-60 shrink-0 flex-col border-r border-sidebar-border bg-sidebar shadow-[1px_0_3px_rgba(0,0,0,0.03)] md:flex">
      <SidebarBrand />
      <SidebarNav role={role} permissions={permissions} />
      <div className="border-t border-sidebar-border px-3 py-3">
        <p className="px-2 text-[11px] leading-relaxed text-muted-foreground">
          Bunyan Digital Ltd
        </p>
      </div>
    </aside>
  );
}
