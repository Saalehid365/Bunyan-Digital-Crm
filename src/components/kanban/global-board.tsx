"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Board } from "./board";
import type { KanbanTask } from "./types";

type AssignableUser = { id: string; name: string | null; email: string };
type ClientServiceOption = { id: string; name: string };

export function GlobalBoard({
  tasks,
  currentUserId,
  isAdmin,
  assignableUsers,
  clientServicesByClient,
}: {
  tasks: KanbanTask[];
  currentUserId: string;
  isAdmin: boolean;
  assignableUsers: AssignableUser[];
  clientServicesByClient: Record<string, ClientServiceOption[]>;
}) {
  const [filter, setFilter] = useState<"mine" | "all">(isAdmin ? "all" : "mine");

  const filtered = useMemo(
    () => (filter === "mine" ? tasks.filter((t) => t.assignedTo?.id === currentUserId) : tasks),
    [tasks, filter, currentUserId],
  );

  return (
    <div className="flex flex-1 flex-col">
      <div className="flex items-center gap-1 border-b border-border px-4 py-3 md:px-6">
        {(["mine", "all"] as const).map((key) => (
          <Button
            key={key}
            size="sm"
            variant="ghost"
            onClick={() => setFilter(key)}
            className={cn(
              "h-7 rounded-[var(--radius-sm)] px-3 text-xs",
              filter === key ? "bg-accent text-foreground" : "text-muted-foreground",
            )}
          >
            {key === "mine" ? "My tasks" : "All tasks"}
          </Button>
        ))}
      </div>
      <Board
        initialTasks={filtered}
        showClient
        assignableUsers={assignableUsers}
        clientServicesByClient={clientServicesByClient}
      />
    </div>
  );
}
