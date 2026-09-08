"use client";

import { useMemo, useState } from "react";
import { Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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

  const [view, setView] = useState<"board" | "table">("table");
  const [search, setSearch] = useState("");
  const [createState, setCreateState] = useState<{ open: boolean; stage: JobStage }>({
    open: false,
    stage: "BACKLOG",
  });
  const [detailJobId, setDetailJobId] = useState<string | null>(null);
  const detailJob = jobs.find((j) => j.id === detailJobId) ?? null;

  const visibleJobs = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return jobs;
    return jobs.filter(
      (j) => j.title.toLowerCase().includes(q) || j.clientName.toLowerCase().includes(q),
    );
  }, [jobs, search]);

  function openCreate(stage: JobStage) {
    setCreateState({ open: true, stage });
  }

  return (
    <div className="flex flex-1 flex-col">
      <div className="flex items-center gap-5 border-b border-border px-4 md:px-6">
        {(["table", "board"] as const).map((key) => (
          <button
            key={key}
            onClick={() => setView(key)}
            className={cn(
              "relative py-3 text-sm capitalize transition-colors",
              view === key ? "font-medium text-foreground" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {key === "table" ? "Main table" : "Board"}
            {view === key ? <span className="absolute inset-x-0 -bottom-px h-[2px] bg-primary" /> : null}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border px-4 py-2.5 md:px-6">
        <div className="flex items-center gap-2">
          {clientId ? (
            <Button size="sm" onClick={() => openCreate("BACKLOG")}>
              <Plus className="h-3.5 w-3.5" /> New job
            </Button>
          ) : null}
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search jobs…"
              className="h-8 w-48 pl-8 text-sm"
            />
          </div>
        </div>
        {extraControls}
      </div>

      {view === "board" ? (
        <Board
          jobs={visibleJobs}
          setJobs={setJobs}
          showClient={showClient}
          canCreate={Boolean(clientId)}
          onAddJob={openCreate}
          onJobClick={(job) => setDetailJobId(job.id)}
        />
      ) : (
        <JobsTable
          jobs={visibleJobs}
          showClient={showClient}
          onJobClick={(job) => setDetailJobId(job.id)}
          onAddJob={clientId ? openCreate : undefined}
        />
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
