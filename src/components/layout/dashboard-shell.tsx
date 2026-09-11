"use client";

import { useEffect, useState } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { CommandPalette } from "@/components/command-palette";
import type { Permission } from "@prisma/client";
import type { DueSoonJob } from "@/lib/due-soon-jobs";

export function DashboardShell({
  role,
  name,
  email,
  permissions,
  dueSoonJobs,
  children,
}: {
  role: "ADMIN" | "MEMBER";
  name: string | null | undefined;
  email: string;
  permissions: Permission[];
  dueSoonJobs: DueSoonJob[];
  children: React.ReactNode;
}) {
  const [paletteOpen, setPaletteOpen] = useState(false);

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setPaletteOpen((v) => !v);
      }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <div className="flex h-screen w-full bg-background">
      <Sidebar role={role} permissions={permissions} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar
          name={name}
          email={email}
          role={role}
          permissions={permissions}
          dueSoonJobs={dueSoonJobs}
          onOpenPalette={() => setPaletteOpen(true)}
        />
        <main className="min-h-0 flex-1 overflow-y-auto">{children}</main>
      </div>
      <CommandPalette role={role} permissions={permissions} open={paletteOpen} onOpenChange={setPaletteOpen} />
    </div>
  );
}
