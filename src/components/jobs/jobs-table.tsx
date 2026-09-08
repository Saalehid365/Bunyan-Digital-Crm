"use client";

import { useTransition } from "react";
import { format, isPast, isToday } from "date-fns";
import { AlertTriangle, ListChecks, Clock } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { JOB_STAGE_LABEL, PRIORITY_LABEL, formatMinutes } from "@/lib/constants";
import { moveJobStage } from "@/server/actions/jobs";
import { EmptyState } from "@/components/empty-state";
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

export function JobsTable({
  jobs,
  showClient,
  onJobClick,
}: {
  jobs: KanbanJob[];
  showClient: boolean;
  onJobClick: (job: KanbanJob) => void;
}) {
  const [pending, startTransition] = useTransition();

  if (jobs.length === 0) {
    return (
      <div className="p-4 md:p-6">
        <EmptyState icon={ListChecks} title="No jobs yet" description="Jobs you add will show up here." />
      </div>
    );
  }

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
          <TableBody>
            {jobs.map((job) => {
              const dueDate = job.dueDate ? new Date(job.dueDate) : null;
              const overdue = dueDate && isPast(dueDate) && !isToday(dueDate) && job.stage !== "DONE";
              const totalMinutes = job.tasks.reduce((sum, t) => sum + t.totalMinutes, 0);
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
                  <TableCell onClick={(e) => e.stopPropagation()}>
                    <Select
                      value={job.stage}
                      disabled={pending}
                      onValueChange={(value) =>
                        startTransition(() => {
                          moveJobStage({ jobId: job.id, stage: value as JobStage, position: job.position });
                        })
                      }
                    >
                      <SelectTrigger size="sm" className="w-36">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {Object.entries(JOB_STAGE_LABEL).map(([value, label]) => (
                          <SelectItem key={value} value={value}>
                            {label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
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
                    {totalMinutes > 0 ? (
                      <span className="inline-flex items-center gap-1 font-mono text-sm tabular-nums text-foreground">
                        <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                        {formatMinutes(totalMinutes)}
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
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
