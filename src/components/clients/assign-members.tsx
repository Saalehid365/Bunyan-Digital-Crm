"use client";

import { useState, useTransition } from "react";
import { X } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { assignMember, unassignMember } from "@/server/actions/clients";

type Member = { id: string; name: string | null; email: string };

function initials(name: string | null, email: string) {
  const source = name?.trim() || email;
  return source.split(/\s+/).map((p) => p[0]).slice(0, 2).join("").toUpperCase();
}

export function AssignMembers({
  clientId,
  assigned,
  available,
}: {
  clientId: string;
  assigned: Member[];
  available: Member[];
}) {
  const [pending, startTransition] = useTransition();
  const [selected, setSelected] = useState("");

  const assignable = available.filter((u) => !assigned.some((a) => a.id === u.id));

  return (
    <div className="space-y-3">
      {assigned.length === 0 ? (
        <p className="text-sm text-muted-foreground">No one assigned yet.</p>
      ) : (
        <ul className="space-y-2">
          {assigned.map((member) => (
            <li key={member.id} className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Avatar className="h-6 w-6">
                  <AvatarFallback className="bg-gradient-accent text-[10px] font-medium text-white shadow-[0_1px_2px_rgba(0,0,0,0.1)]">
                    {initials(member.name, member.email)}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm text-foreground">{member.name || member.email}</span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 text-muted-foreground hover:text-destructive"
                disabled={pending}
                onClick={() => startTransition(() => unassignMember(clientId, member.id))}
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            </li>
          ))}
        </ul>
      )}

      {assignable.length > 0 ? (
        <div className="flex gap-2 pt-1">
          <Select value={selected} onValueChange={setSelected}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Add team member…" />
            </SelectTrigger>
            <SelectContent>
              {assignable.map((u) => (
                <SelectItem key={u.id} value={u.id}>
                  {u.name || u.email}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            size="sm"
            disabled={!selected || pending}
            onClick={() =>
              startTransition(async () => {
                await assignMember(clientId, selected);
                setSelected("");
              })
            }
          >
            Add
          </Button>
        </div>
      ) : null}
    </div>
  );
}
