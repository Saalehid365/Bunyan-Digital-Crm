"use client";

import { useTransition } from "react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { setUserRole, setUserDisabled } from "@/server/actions/team";
import { toast } from "sonner";

type TeamMember = {
  id: string;
  name: string | null;
  email: string;
  role: "ADMIN" | "MEMBER";
  disabledAt: Date | null;
};

function initials(name: string | null, email: string) {
  const source = name?.trim() || email;
  return source.split(/\s+/).map((p) => p[0]).slice(0, 2).join("").toUpperCase();
}

export function TeamTable({ members, currentUserId }: { members: TeamMember[]; currentUserId: string }) {
  const [pending, startTransition] = useTransition();

  return (
    <ul className="divide-y divide-border">
      {members.map((member) => (
        <li key={member.id} className="flex flex-wrap items-center justify-between gap-3 py-3">
          <div className="flex items-center gap-3">
            <Avatar className="h-8 w-8">
              <AvatarFallback className="bg-primary text-xs font-medium text-primary-foreground shadow-[0_1px_2px_rgba(0,0,0,0.1)]">
                {initials(member.name, member.email)}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="text-sm font-medium text-foreground">
                {member.name || member.email}
                {member.id === currentUserId ? (
                  <span className="ml-1.5 text-xs font-normal text-muted-foreground">(you)</span>
                ) : null}
              </p>
              <p className="text-xs text-muted-foreground">{member.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Select
              value={member.role}
              disabled={pending || member.id === currentUserId}
              onValueChange={(value) =>
                startTransition(() => {
                  setUserRole(member.id, value);
                })
              }
            >
              <SelectTrigger size="sm" className="w-36">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="MEMBER">Team member</SelectItem>
                <SelectItem value="ADMIN">Admin</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex items-center gap-2">
              <span className="text-xs text-muted-foreground">
                {member.disabledAt ? "Disabled" : "Active"}
              </span>
              <Switch
                checked={!member.disabledAt}
                disabled={pending || member.id === currentUserId}
                onCheckedChange={(checked) =>
                  startTransition(async () => {
                    const result = await setUserDisabled(member.id, !checked);
                    if (result?.error) toast.error(result.error);
                  })
                }
              />
            </div>
          </div>
        </li>
      ))}
    </ul>
  );
}
