"use client";

import { useMemo, useState } from "react";
import { Plus, Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { JOB_STAGES, PRIORITY_LABEL, RECURRENCE_TABS } from "@/lib/constants";
import { STAGE_DOT } from "@/components/jobs/status-cell";
import { MultiSelectFilter } from "@/components/jobs/multi-select-filter";
import { Board } from "@/components/kanban/board";
import { JobsTable } from "@/components/jobs/jobs-table";
import { JobFormDialog } from "@/components/kanban/job-form-dialog";
import { JobDetailSheet } from "@/components/kanban/job-detail-sheet";
import type { KanbanJob } from "@/components/kanban/types";
import type { JobStage, Priority, Recurrence } from "@prisma/client";

type AssignableUser = { id: string; name: string | null; email: string };
type ClientServiceOption = { id: string; name: string };

const PRIORITY_DOT: Record<Priority, string> = {
  URGENT: "bg-destructive",
  HIGH: "bg-primary",
  MEDIUM: "bg-chart-4",
  LOW: "bg-muted-foreground/50",
};

export function JobsView({
  initialJobs,
  showClient,
  clientId,
  clients,
  currentUserId,
  isAdmin,
  assignableUsers,
  clientServicesByClient,
  extraControls,
}: {
  initialJobs: KanbanJob[];
  showClient: boolean;
  /** Fixed client scope for a per-client board. Omit (with `clients`) for the cross-client global board. */
  clientId?: string;
  /** Every client the user can create a job for — required when `clientId` isn't fixed. */
  clients?: { id: string; name: string }[];
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
  const [clientFilter, setClientFilter] = useState<string[]>([]);
  const [stageFilter, setStageFilter] = useState<string[]>([]);
  const [assigneeFilter, setAssigneeFilter] = useState<string[]>([]);
  const [priorityFilter, setPriorityFilter] = useState<string[]>([]);
  const [recurrenceTab, setRecurrenceTab] = useState<Recurrence | "ALL">("ALL");
  const [createState, setCreateState] = useState<{ open: boolean; stage: JobStage }>({
    open: false,
    stage: "BACKLOG",
  });
  const [detailJobId, setDetailJobId] = useState<string | null>(null);
  const detailJob = jobs.find((j) => j.id === detailJobId) ?? null;

  const clientOptions = useMemo(() => {
    const seen = new Map<string, string>();
    for (const j of jobs) seen.set(j.clientId, j.clientName);
    return Array.from(seen.entries())
      .map(([value, label]) => ({ value, label }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }, [jobs]);

  const assigneeOptions = useMemo(() => {
    const seen = new Map<string, string>();
    let hasUnassigned = false;
    for (const j of jobs) {
      if (j.assignedTo) seen.set(j.assignedTo.id, j.assignedTo.name ?? "Unnamed");
      else hasUnassigned = true;
    }
    const opts = Array.from(seen.entries())
      .map(([value, label]) => ({ value, label }))
      .sort((a, b) => a.label.localeCompare(b.label));
    return hasUnassigned ? [...opts, { value: "unassigned", label: "Unassigned" }] : opts;
  }, [jobs]);

  const stageOptions = JOB_STAGES.map((s) => ({ value: s.value, label: s.label, dot: STAGE_DOT[s.value] }));
  const priorityOptions = Object.entries(PRIORITY_LABEL).map(([value, label]) => ({
    value,
    label,
    dot: PRIORITY_DOT[value as Priority],
  }));

  const activeFilterCount =
    clientFilter.length + stageFilter.length + assigneeFilter.length + priorityFilter.length;

  const visibleJobs = useMemo(() => {
    const q = search.trim().toLowerCase();
    return jobs.filter((j) => {
      if (q && !j.title.toLowerCase().includes(q) && !j.clientName.toLowerCase().includes(q)) return false;
      if (clientFilter.length > 0 && !clientFilter.includes(j.clientId)) return false;
      if (stageFilter.length > 0 && !stageFilter.includes(j.stage)) return false;
      if (priorityFilter.length > 0 && !priorityFilter.includes(j.priority)) return false;
      if (assigneeFilter.length > 0) {
        const assigneeKey = j.assignedTo?.id ?? "unassigned";
        if (!assigneeFilter.includes(assigneeKey)) return false;
      }
      if (recurrenceTab !== "ALL" && j.recurrence !== recurrenceTab) return false;
      return true;
    });
  }, [jobs, search, clientFilter, stageFilter, assigneeFilter, priorityFilter, recurrenceTab]);

  function openCreate(stage: JobStage) {
    setCreateState({ open: true, stage });
  }

  function clearFilters() {
    setClientFilter([]);
    setStageFilter([]);
    setAssigneeFilter([]);
    setPriorityFilter([]);
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
        <div className="flex flex-wrap items-center gap-2">
          <Button
            size="sm"
            onClick={() => openCreate("BACKLOG")}
            disabled={!clientId && (!clients || clients.length === 0)}
          >
            <Plus className="h-3.5 w-3.5" /> New job
          </Button>
          <div className="relative">
            <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search jobs…"
              className="h-8 w-44 pl-8 text-sm"
            />
          </div>

          <div className="mx-1 h-5 w-px bg-border" />

          {showClient ? (
            <MultiSelectFilter
              label="Client"
              options={clientOptions}
              selected={clientFilter}
              onChange={setClientFilter}
            />
          ) : null}
          <MultiSelectFilter label="Status" options={stageOptions} selected={stageFilter} onChange={setStageFilter} />
          <MultiSelectFilter
            label="Assignee"
            options={assigneeOptions}
            selected={assigneeFilter}
            onChange={setAssigneeFilter}
          />
          <MultiSelectFilter
            label="Priority"
            options={priorityOptions}
            selected={priorityFilter}
            onChange={setPriorityFilter}
          />
          {activeFilterCount > 0 ? (
            <button
              onClick={clearFilters}
              className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
            >
              <X className="h-3 w-3" /> Clear filters
            </button>
          ) : null}
        </div>
        {extraControls}
      </div>

      <div className="flex items-center gap-1 border-b border-border px-4 py-2 md:px-6">
        {RECURRENCE_TABS.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setRecurrenceTab(tab.value)}
            className={cn(
              "rounded-[var(--radius-sm)] px-2.5 py-1 text-xs font-medium transition-colors",
              recurrenceTab === tab.value
                ? "bg-accent text-foreground"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {tab.label}
          </button>
        ))}
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

      <JobFormDialog
        open={createState.open}
        onOpenChange={(open) => setCreateState((s) => ({ ...s, open }))}
        clientId={clientId}
        clients={clients}
        defaultStage={createState.stage}
        assignableUsers={assignableUsers}
        clientServicesByClient={clientServicesByClient}
        onDone={() => setCreateState((s) => ({ ...s, open: false }))}
      />

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
