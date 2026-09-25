"use client";

import { Search } from "lucide-react";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { DueSoonBell } from "@/components/layout/due-soon-bell";
import { UserMenu } from "@/components/layout/user-menu";
import { MobileNav } from "@/components/layout/mobile-nav";
import type { Permission } from "@prisma/client";
import type { DueSoonJob } from "@/lib/due-soon-jobs";

export function Topbar({
  name,
  email,
  role,
  permissions,
  dueSoonJobs,
  newApplications,
  onOpenPalette,
}: {
  name: string | null | undefined;
  email: string;
  role: "ADMIN" | "MEMBER";
  permissions: Permission[];
  dueSoonJobs: DueSoonJob[];
  newApplications: number;
  onOpenPalette: () => void;
}) {
  return (
    <header className="dark relative z-10 flex h-14 shrink-0 items-center justify-between gap-2 border-b border-white/10 bg-[#05081a] px-4 text-foreground md:px-6">
      <div className="flex min-w-0 items-center gap-2">
        <MobileNav role={role} permissions={permissions} newApplications={newApplications} />
        <button
          onClick={onOpenPalette}
          className="flex w-9 items-center gap-2 rounded-full border border-border bg-white/[0.06] px-3 py-1.5 text-sm text-muted-foreground transition-all duration-150 hover:border-primary/40 hover:bg-muted hover:text-foreground hover:shadow-[0_0_0_3px_color-mix(in_oklab,var(--primary),transparent_88%)] sm:w-56 sm:px-3"
        >
          <Search className="h-3.5 w-3.5 shrink-0" />
          <span className="hidden flex-1 text-left sm:inline">Search…</span>
          <kbd className="hidden rounded border border-border bg-background px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground sm:inline">
            ⌘K
          </kbd>
        </button>
      </div>

      <div className="flex shrink-0 items-center gap-1.5">
        <DueSoonBell jobs={dueSoonJobs} />
        <ThemeToggle />
        <UserMenu name={name} email={email} role={role} />
      </div>
    </header>
  );
}
