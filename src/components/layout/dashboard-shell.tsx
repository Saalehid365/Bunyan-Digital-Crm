"use client";

import { useEffect, useState } from "react";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { CommandPalette } from "@/components/command-palette";

export function DashboardShell({
  role,
  name,
  email,
  children,
}: {
  role: "ADMIN" | "MEMBER";
  name: string | null | undefined;
  email: string;
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
    <div className="flex min-h-screen w-full bg-background">
      <Sidebar role={role} />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar
          name={name}
          email={email}
          role={role}
          onOpenPalette={() => setPaletteOpen(true)}
        />
        <main className="flex-1 overflow-y-auto">{children}</main>
      </div>
      <CommandPalette isAdmin={role === "ADMIN"} open={paletteOpen} onOpenChange={setPaletteOpen} />
    </div>
  );
}
