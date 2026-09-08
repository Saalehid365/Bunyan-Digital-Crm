"use client";

import { Search } from "lucide-react";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { UserMenu } from "@/components/layout/user-menu";

export function Topbar({
  name,
  email,
  role,
  onOpenPalette,
}: {
  name: string | null | undefined;
  email: string;
  role: "ADMIN" | "MEMBER";
  onOpenPalette: () => void;
}) {
  return (
    <header className="flex h-14 shrink-0 items-center justify-between border-b border-border px-4 md:px-6">
      <button
        onClick={onOpenPalette}
        className="flex w-56 items-center gap-2 rounded-[var(--radius-sm)] border border-border bg-muted/40 px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:border-line hover:text-foreground"
      >
        <Search className="h-3.5 w-3.5" />
        <span className="flex-1 text-left">Search…</span>
        <kbd className="rounded border border-border bg-background px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
          ⌘K
        </kbd>
      </button>

      <div className="flex items-center gap-1.5">
        <ThemeToggle />
        <UserMenu name={name} email={email} role={role} />
      </div>
    </header>
  );
}
