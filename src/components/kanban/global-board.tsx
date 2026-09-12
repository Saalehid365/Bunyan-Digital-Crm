"use client";

import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { JobsView } from "@/components/jobs/jobs-view";
import type { KanbanJob } from "./types";
import type { QuoteStatus, InvoiceStatus } from "@prisma/client";

type AssignableUser = { id: string; name: string | null; email: string };
type ClientServiceOption = { id: string; name: string };
type QuoteOption = { id: string; number: number; status: QuoteStatus };
type InvoiceOption = { id: string; number: number; status: InvoiceStatus };

export function GlobalBoard({
  jobs,
  clients,
  currentUserId,
  isAdmin,
  assignableUsers,
  clientServicesByClient,
  quotesByClient,
  invoicesByClient,
}: {
  jobs: KanbanJob[];
  clients: { id: string; name: string }[];
  currentUserId: string;
  isAdmin: boolean;
  assignableUsers: AssignableUser[];
  clientServicesByClient: Record<string, ClientServiceOption[]>;
  quotesByClient: Record<string, QuoteOption[]>;
  invoicesByClient: Record<string, InvoiceOption[]>;
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
      quotesByClient={quotesByClient}
      invoicesByClient={invoicesByClient}
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
