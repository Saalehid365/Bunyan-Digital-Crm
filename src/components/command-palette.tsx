"use client";

import { useRouter } from "next/navigation";
import { LayoutDashboard, Users, KanbanSquare, Clock, BarChart3, UsersRound, Settings, Plus } from "lucide-react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";

export function CommandPalette({
  isAdmin,
  open,
  onOpenChange,
}: {
  isAdmin: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const router = useRouter();

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
          {isAdmin ? (
            <CommandItem onSelect={() => go("/reports")}>
              <BarChart3 className="h-4 w-4" /> Reports
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
        {isAdmin ? (
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
