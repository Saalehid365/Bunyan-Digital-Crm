"use client";

import { useRouter } from "next/navigation";
import { LayoutDashboard, Users, KanbanSquare, Clock, BarChart3, UsersRound, Settings, Plus, Receipt, Radar } from "lucide-react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import type { Permission } from "@prisma/client";

export function CommandPalette({
  role,
  permissions,
  open,
  onOpenChange,
}: {
  role: "ADMIN" | "MEMBER";
  permissions: Permission[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();
  const isAdmin = role === "ADMIN";
  const canViewReports = isAdmin || permissions.includes("VIEW_REPORTS");
  const canManageClients = isAdmin || permissions.includes("MANAGE_CLIENTS");
  const canManageBilling = isAdmin || permissions.includes("MANAGE_BILLING");

  function go(href: string) {
    onOpenChange(false);
    router.push(href);
  }

  return (
    <CommandDialog open={open} onOpenChange={onOpenChange}>
      <CommandInput placeholder="Jump to…" />
      <CommandList>
        <CommandEmpty>No results found.</CommandEmpty>
        <CommandGroup heading="Navigate">
          <CommandItem onSelect={() => go("/dashboard")}>
            <LayoutDashboard className="h-4 w-4" /> Dashboard
          </CommandItem>
          <CommandItem onSelect={() => go("/clients")}>
            <Users className="h-4 w-4" /> Clients
          </CommandItem>
          <CommandItem onSelect={() => go("/board")}>
            <KanbanSquare className="h-4 w-4" /> Jobs
          </CommandItem>
          <CommandItem onSelect={() => go("/timesheets")}>
            <Clock className="h-4 w-4" /> Timesheets
          </CommandItem>
          {canViewReports ? (
            <CommandItem onSelect={() => go("/reports")}>
              <BarChart3 className="h-4 w-4" /> Reports
            </CommandItem>
          ) : null}
          {canManageBilling ? (
            <CommandItem onSelect={() => go("/invoices")}>
              <Receipt className="h-4 w-4" /> Quotes & Invoices
            </CommandItem>
          ) : null}
          {isAdmin ? (
            <CommandItem onSelect={() => go("/revenue-finder")}>
              <Radar className="h-4 w-4" /> Revenue Finder
            </CommandItem>
          ) : null}
          {isAdmin ? (
            <CommandItem onSelect={() => go("/team")}>
              <UsersRound className="h-4 w-4" /> Team
            </CommandItem>
          ) : null}
          <CommandItem onSelect={() => go("/settings")}>
            <Settings className="h-4 w-4" /> Settings
          </CommandItem>
        </CommandGroup>
        {canManageClients ? (
          <>
            <CommandSeparator />
            <CommandGroup heading="Create">
              <CommandItem onSelect={() => go("/clients/new")}>
                <Plus className="h-4 w-4" /> New client
              </CommandItem>
            </CommandGroup>
          </>
        ) : null}
      </CommandList>
    </CommandDialog>
  );
}
