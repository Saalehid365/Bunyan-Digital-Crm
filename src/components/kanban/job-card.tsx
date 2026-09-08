"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { isPast, isToday, format } from "date-fns";
import { AlertTriangle, Clock, ListChecks } from "lucide-react";
import { cn } from "@/lib/utils";
import { PRIORITY_LABEL, formatMinutes } from "@/lib/constants";
import type { KanbanJob } from "./types";
import type { Priority } from "@prisma/client";

const PRIORITY_DOT: Record<Priority, string> = {
  URGENT: "bg-destructive",
  HIGH: "bg-primary",
  MEDIUM: "bg-chart-4",
  LOW: "bg-muted-foreground/50",
};

function initials(name: string | null) {
  if (!name) return "?";
  return name.split(/\s+/).map((p) => p[0]).slice(0, 2).join("").toUpperCase();
}

export function JobCard({
  job,
  showClient,
  onClick,
  overlay,
}: {
  job: KanbanJob;
  showClient: boolean;
  onClick?: () => void;
  overlay?: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: job.id,
    data: { stage: job.stage },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const dueDate = job.dueDate ? new Date(job.dueDate) : null;
  const overdue = dueDate && isPast(dueDate) && !isToday(dueDate) && job.stage !== "DONE";
  const totalMinutes = job.tasks.reduce((sum, t) => sum + t.totalMinutes, 0);
  const doneTasks = job.tasks.filter((t) => t.done).length;

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={onClick}
      className={cn(
        "cursor-pointer rounded-[var(--radius-md)] border border-border bg-card p-3 shadow-none transition-shadow",
        isDragging && !overlay ? "opacity-30" : "",
        overlay ? "rotate-1 shadow-lg" : "hover:border-line",
      )}
    >
      <div className="mb-2 flex items-start justify-between gap-2">
        <p className="text-sm font-medium leading-snug text-foreground">{job.title}</p>
        <span
          className={cn("mt-1 h-1.5 w-1.5 shrink-0 rounded-full", PRIORITY_DOT[job.priority])}
          title={PRIORITY_LABEL[job.priority]}
        />
      </div>

      {showClient || job.serviceTypeName ? (
        <div className="mb-2 flex flex-wrap items-center gap-1.5">
          {showClient ? (
            <span className="text-xs text-muted-foreground">{job.clientName}</span>
          ) : null}
          {job.serviceTypeName ? (
            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
              <span
                className="h-1.5 w-1.5 rounded-full"
                style={{ backgroundColor: job.serviceTypeColor ?? "var(--muted-foreground)" }}
              />
              {job.serviceTypeName}
            </span>
          ) : null}
        </div>
      ) : null}

      {job.tasks.length > 0 || totalMinutes > 0 ? (
        <div className="mb-2 flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground">
          {job.tasks.length > 0 ? (
            <span className="inline-flex items-center gap-1">
              <ListChecks className="h-3 w-3" />
              {doneTasks}/{job.tasks.length}
            </span>
          ) : null}
          {totalMinutes > 0 ? (
            <span className="inline-flex items-center gap-1 font-mono tabular-nums">
              <Clock className="h-3 w-3" />
              {formatMinutes(totalMinutes)}
            </span>
          ) : null}
        </div>
      ) : null}

      <div className="flex items-center justify-between">
        {dueDate ? (
          <span
            className={cn(
              "inline-flex items-center gap-1 font-mono text-[11px] tabular-nums",
              overdue ? "text-destructive" : "text-muted-foreground",
            )}
          >
            {overdue ? <AlertTriangle className="h-3 w-3" /> : null}
            {format(dueDate, "d MMM")}
          </span>
        ) : (
          <span />
        )}
        {job.assignedTo ? (
          <span
            className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/15 text-[9px] font-medium text-primary"
            title={job.assignedTo.name ?? ""}
          >
            {initials(job.assignedTo.name)}
          </span>
        ) : null}
      </div>
    </div>
  );
}
