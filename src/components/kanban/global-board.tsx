"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { JobsView } from "@/components/jobs/jobs-view";
import type { KanbanJob } from "./types";

type AssignableUser = { id: string; name: string | null; email: string };
type ClientServiceOption = { id: string; name: string };

export function GlobalBoard({
  jobs,
  clients,
  currentUserId,
  isAdmin,
  assignableUsers,
  clientServicesByClient,
}: {
  jobs: KanbanJob[];
  clients: { id: string; name: string }[];
  currentUserId: string;
  isAdmin: boolean;
  assignableUsers: AssignableUser[];
  clientServicesByClient: Record<string, ClientServiceOption[]>;
}) {
  const [filter, setFilter] = useState<"mine" | "all">(isAdmin ? "all" : "mine");

  const filtered = useMemo(
    () => (filter === "mine" ? jobs.filter((j) => j.assignedTo?.id === currentUserId) : jobs),
    [jobs, filter, currentUserId],
  );

  return (
    <JobsView
      initialJobs={filtered}
      showClient
      clients={clients}
      currentUserId={currentUserId}
      isAdmin={isAdmin}
      assignableUsers={assignableUsers}
      clientServicesByClient={clientServicesByClient}
      extraControls={
        <div className="flex items-center gap-1">
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
              {key === "mine" ? "My jobs" : "All jobs"}
            </Button>
          ))}
        </div>
      }
    />
  );
}
