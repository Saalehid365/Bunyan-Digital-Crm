"use client";

import { LogOut } from "lucide-react";
import { signOut } from "next-auth/react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { BASE_PATH } from "@/lib/base-path";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

function initials(name: string | null | undefined, email: string) {
  const source = name?.trim() || email;
  return source
    .split(/\s+/)
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
}

export function UserMenu({
  name,
  email,
  role,
}: {
  name: string | null | undefined;
  email: string;
  role: "ADMIN" | "MEMBER";
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="flex items-center gap-2 rounded-[var(--radius-sm)] p-1 pr-2 outline-none hover:bg-accent">
        <Avatar className="h-7 w-7">
          <AvatarFallback className="bg-primary/15 text-[11px] font-medium text-primary">
            {initials(name, email)}
          </AvatarFallback>
        </Avatar>
        <span className="hidden text-sm text-foreground sm:inline">{name || email}</span>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="font-normal">
          <p className="text-sm font-medium text-foreground">{name || "—"}</p>
          <p className="text-xs text-muted-foreground">{email}</p>
          <p className="mt-1 text-[11px] uppercase tracking-wide text-muted-foreground/70">
            {role === "ADMIN" ? "Admin" : "Team member"}
          </p>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          variant="destructive"
          onClick={() => signOut({ redirectTo: `${BASE_PATH}/login` })}
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
