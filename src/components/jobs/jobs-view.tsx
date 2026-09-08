"use client";

import { useState } from "react";
import { KanbanSquare, Table2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Board } from "@/components/kanban/board";
import { JobsTable } from "@/components/jobs/jobs-table";
import { JobFormDialog } from "@/components/kanban/job-form-dialog";
import { JobDetailSheet } from "@/components/kanban/job-detail-sheet";
import type { KanbanJob } from "@/components/kanban/types";
import type { JobStage } from "@prisma/client";

type AssignableUser = { id: string; name: string | null; email: string };
type ClientServiceOption = { id: string; name: string };

export function JobsView({
  initialJobs,
  showClient,
  clientId,
  currentUserId,
  isAdmin,
  assignableUsers,
  clientServicesByClient,
  extraControls,
}: {
  initialJobs: KanbanJob[];
  showClient: boolean;
  /** Fixed client scope for a per-client board. Omit for the cross-client global board. */
  clientId?: string;
  currentUserId: string;
  isAdmin: boolean;
  assignableUsers: AssignableUser[];
  clientServicesByClient: Record<string, ClientServiceOption[]>;
  extraControls?: React.ReactNode;
}) {
  const [jobs, setJobs] = useState(initialJobs);
  const [syncedJobs, setSyncedJobs] = useState(initialJobs);
  if (initialJobs !== syncedJobs) {
    setSyncedJobs(initialJobs);
    setJobs(initialJobs);
  }

  const [view, setView] = useState<"board" | "table">("board");
  const [createState, setCreateState] = useState<{ open: boolean; stage: JobStage }>({
    open: false,
    stage: "BACKLOG",
  });
  const [detailJobId, setDetailJobId] = useState<string | null>(null);
  const detailJob = jobs.find((j) => j.id === detailJobId) ?? null;

  return (
    <div className="flex flex-1 flex-col">
      <div className="flex items-center justify-between border-b border-border px-4 py-2.5 md:px-6">
        <div className="flex items-center gap-1">
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setView("board")}
            className={cn(
              "h-7 rounded-[var(--radius-sm)] px-2.5 text-xs",
              view === "board" ? "bg-accent text-foreground" : "text-muted-foreground",
            )}
          >
            <KanbanSquare className="h-3.5 w-3.5" /> Board
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => setView("table")}
            className={cn(
              "h-7 rounded-[var(--radius-sm)] px-2.5 text-xs",
              view === "table" ? "bg-accent text-foreground" : "text-muted-foreground",
            )}
          >
            <Table2 className="h-3.5 w-3.5" /> Table
          </Button>
        </div>
        {extraControls}
      </div>

      {view === "board" ? (
        <Board
          jobs={jobs}
          setJobs={setJobs}
          showClient={showClient}
          canCreate={Boolean(clientId)}
          onAddJob={(stage) => setCreateState({ open: true, stage })}
          onJobClick={(job) => setDetailJobId(job.id)}
        />
      ) : (
        <JobsTable jobs={jobs} showClient={showClient} onJobClick={(job) => setDetailJobId(job.id)} />
      )}

      {clientId ? (
        <JobFormDialog
          open={createState.open}
          onOpenChange={(open) => setCreateState((s) => ({ ...s, open }))}
          clientId={clientId}
          defaultStage={createState.stage}
          assignableUsers={assignableUsers}
          clientServices={clientServicesByClient[clientId] ?? []}
          onDone={() => setCreateState((s) => ({ ...s, open: false }))}
        />
      ) : null}

      <JobDetailSheet
        job={detailJob}
        open={Boolean(detailJob)}
        onOpenChange={(open) => !open && setDetailJobId(null)}
        assignableUsers={assignableUsers}
        clientServices={detailJob ? clientServicesByClient[detailJob.clientId] ?? [] : []}
        currentUserId={currentUserId}
        isAdmin={isAdmin}
      />
    </div>
  );
}
