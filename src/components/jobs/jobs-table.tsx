"use client";

import { useState } from "react";
import { format, isPast, isToday } from "date-fns";
import { AlertTriangle, ChevronDown, ListChecks, Plus } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import { JOB_STAGES, PRIORITY_LABEL, formatMinutes } from "@/lib/constants";
import { EmptyState } from "@/components/empty-state";
import { StatusCell, STAGE_DOT } from "@/components/jobs/status-cell";
import type { KanbanJob } from "@/components/kanban/types";
import type { JobStage, Priority } from "@prisma/client";

function initials(name: string | null) {
  if (!name) return "?";
  return name.split(/\s+/).map((p) => p[0]).slice(0, 2).join("").toUpperCase();
}

const PRIORITY_DOT: Record<Priority, string> = {
  URGENT: "bg-destructive",
  HIGH: "bg-primary",
  MEDIUM: "bg-chart-4",
  LOW: "bg-muted-foreground/50",
};

const COLS = 7; // colspan for group header/summary/empty rows when a client column is shown
const COLS_NO_CLIENT = 6;

export function JobsTable({
  jobs,
  showClient,
  onJobClick,
  onAddJob,
}: {
  jobs: KanbanJob[];
  showClient: boolean;
  onJobClick: (job: KanbanJob) => void;
  onAddJob?: (stage: JobStage) => void;
}) {
  const [collapsed, setCollapsed] = useState<Set<JobStage>>(new Set());
  const colSpan = showClient ? COLS : COLS_NO_CLIENT;

  if (jobs.length === 0) {
    return (
      <div className="p-4 md:p-6">
        <EmptyState icon={ListChecks} title="No jobs yet" description="Jobs you add will show up here." />
      </div>
    );
  }

  const groups = JOB_STAGES.map((s) => ({
    stage: s.value,
    label: s.label,
    jobs: jobs.filter((j) => j.stage === s.value).sort((a, b) => a.position - b.position),
  })).filter((g) => g.jobs.length > 0);

  return (
    <div className="overflow-x-auto p-4 md:p-6">
      <div className="overflow-hidden rounded-[var(--radius-lg)] border border-border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Job</TableHead>
              {showClient ? <TableHead>Client</TableHead> : null}
              <TableHead>Status</TableHead>
              <TableHead>Assignee</TableHead>
              <TableHead>Tasks</TableHead>
              <TableHead>Time logged</TableHead>
              <TableHead>Due</TableHead>
            </TableRow>
          </TableHeader>

          {groups.map((group) => {
            const isCollapsed = collapsed.has(group.stage);
            const totalMinutes = group.jobs.reduce(
              (sum, j) => sum + j.tasks.reduce((s, t) => s + t.totalMinutes, 0),
              0,
            );

            return (
              <TableBody key={group.stage} className="border-t-2 border-border first:border-t-0">
                <TableRow className="hover:bg-transparent">
                  <TableCell colSpan={colSpan} className="bg-muted/40 py-2">
                    <button
                      onClick={() =>
                        setCollapsed((prev) => {
                          const next = new Set(prev);
                          if (next.has(group.stage)) next.delete(group.stage);
                          else next.add(group.stage);
                          return next;
                        })
                      }
                      className="flex items-center gap-2"
                    >
                      <ChevronDown
                        className={cn("h-3.5 w-3.5 text-muted-foreground transition-transform", isCollapsed && "-rotate-90")}
                      />
                      <span className={cn("h-2 w-2 rounded-full", STAGE_DOT[group.stage])} />
                      <span className="text-sm font-medium text-foreground">{group.label}</span>
                      <span className="font-mono text-xs tabular-nums text-muted-foreground">
                        {group.jobs.length}
                      </span>
                    </button>
                  </TableCell>
                </TableRow>

                {!isCollapsed
                  ? group.jobs.map((job) => {
                      const dueDate = job.dueDate ? new Date(job.dueDate) : null;
                      const overdue = dueDate && isPast(dueDate) && !isToday(dueDate) && job.stage !== "DONE";
                      const jobMinutes = job.tasks.reduce((sum, t) => sum + t.totalMinutes, 0);
                      const doneTasks = job.tasks.filter((t) => t.done).length;

                      return (
                        <TableRow key={job.id} className="cursor-pointer">
                          <TableCell className="max-w-[220px]" onClick={() => onJobClick(job)}>
                            <div className="flex items-center gap-2">
                              <span
                                className={cn("h-1.5 w-1.5 shrink-0 rounded-full", PRIORITY_DOT[job.priority])}
                                title={PRIORITY_LABEL[job.priority]}
                              />
                              <span className="truncate font-medium text-foreground">{job.title}</span>
                            </div>
                          </TableCell>
                          {showClient ? (
                            <TableCell onClick={() => onJobClick(job)} className="text-muted-foreground">
                              {job.clientName}
                            </TableCell>
                          ) : null}
                          <TableCell className="w-36">
                            <StatusCell jobId={job.id} stage={job.stage} position={job.position} />
                          </TableCell>
                          <TableCell onClick={() => onJobClick(job)}>
                            {job.assignedTo ? (
                              <span className="inline-flex items-center gap-1.5 text-sm text-foreground">
                                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/15 text-[9px] font-medium text-primary">
                                  {initials(job.assignedTo.name)}
                                </span>
                                {job.assignedTo.name}
                              </span>
                            ) : (
                              <span className="text-sm text-muted-foreground">—</span>
                            )}
                          </TableCell>
                          <TableCell onClick={() => onJobClick(job)}>
                            {job.tasks.length > 0 ? (
                              <span className="inline-flex items-center gap-1 text-sm text-muted-foreground">
                                <ListChecks className="h-3.5 w-3.5" />
                                {doneTasks}/{job.tasks.length}
                              </span>
                            ) : (
                              <span className="text-sm text-muted-foreground">—</span>
                            )}
                          </TableCell>
                          <TableCell onClick={() => onJobClick(job)}>
                            {jobMinutes > 0 ? (
                              <span className="font-mono text-sm tabular-nums text-foreground">
                                {formatMinutes(jobMinutes)}
                              </span>
                            ) : (
                              <span className="text-sm text-muted-foreground">—</span>
                            )}
                          </TableCell>
                          <TableCell onClick={() => onJobClick(job)}>
                            {dueDate ? (
                              <span
                                className={cn(
                                  "inline-flex items-center gap-1 font-mono text-sm tabular-nums",
                                  overdue ? "text-destructive" : "text-muted-foreground",
                                )}
                              >
                                {overdue ? <AlertTriangle className="h-3.5 w-3.5" /> : null}
                                {format(dueDate, "d MMM")}
                              </span>
                            ) : (
                              <span className="text-sm text-muted-foreground">—</span>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })
                  : null}

                {!isCollapsed && onAddJob ? (
                  <TableRow className="hover:bg-transparent">
                    <TableCell colSpan={colSpan} className="py-1.5">
                      <button
                        onClick={() => onAddJob(group.stage)}
                        className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
                      >
                        <Plus className="h-3.5 w-3.5" /> Add job
                      </button>
                    </TableCell>
                  </TableRow>
                ) : null}

                {!isCollapsed ? (
                  <TableRow className="border-t border-border bg-muted/20 hover:bg-muted/20">
                    <TableCell colSpan={showClient ? 4 : 3} className="py-1.5 text-xs text-muted-foreground">
                      {group.jobs.length} job{group.jobs.length === 1 ? "" : "s"}
                    </TableCell>
                    <TableCell colSpan={showClient ? 3 : 3} className="py-1.5">
                      {totalMinutes > 0 ? (
                        <span className="font-mono text-xs font-medium tabular-nums text-foreground">
                          {formatMinutes(totalMinutes)} total
                        </span>
                      ) : null}
                    </TableCell>
                  </TableRow>
                ) : null}
              </TableBody>
            );
          })}
        </Table>
      </div>
    </div>
  );
}
