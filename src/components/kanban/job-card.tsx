"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { isPast, isToday, format } from "date-fns";
import { AlertTriangle, Clock, ListChecks, Repeat, Flame } from "lucide-react";
import { cn } from "@/lib/utils";
import { PRIORITY_LABEL, RECURRENCE_LABEL, PRIORITY_DOT_CLASS, PRIORITY_STRIPE_CLASS, formatMinutes } from "@/lib/constants";
import type { KanbanJob } from "./types";

export function initials(name: string | null) {
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
        "cursor-pointer rounded-[var(--radius-md)] border border-border p-3 shadow-[0_1px_2px_rgba(0,0,0,0.04)] transition-all duration-200 ease-[cubic-bezier(0.16,0.8,0.3,1)]",
        job.priority === "URGENT" ? "border-l-4 bg-destructive/[0.05]" : "border-l-[3px] bg-card",
        PRIORITY_STRIPE_CLASS[job.priority],
        isDragging && !overlay ? "opacity-30" : "",
        overlay
          ? "rotate-1 shadow-lg"
          : "hover:-translate-y-1 hover:shadow-[0_8px_24px_-6px_rgba(0,0,0,0.2)]",
      )}
    >
      <div className="mb-2 flex items-start justify-between gap-2">
        <p className="text-sm font-medium leading-snug text-foreground">{job.title}</p>
        {job.priority === "URGENT" ? (
          <span className="mt-0.5 inline-flex shrink-0 items-center gap-1 rounded-full bg-destructive/15 px-2 py-0.5 text-[10px] font-semibold text-destructive">
            <Flame className="h-2.5 w-2.5" />
            Urgent
          </span>
        ) : (
          <span
            className={cn("mt-1 h-1.5 w-1.5 shrink-0 rounded-full", PRIORITY_DOT_CLASS[job.priority])}
            title={PRIORITY_LABEL[job.priority]}
          />
        )}
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

      {job.tasks.length > 0 || totalMinutes > 0 || job.recurrence !== "NONE" ? (
        <div className="mb-2 flex flex-wrap items-center gap-3 text-[11px] text-muted-foreground">
          {job.recurrence !== "NONE" ? (
            <span className="inline-flex items-center gap-1">
              <Repeat className="h-3 w-3" />
              {RECURRENCE_LABEL[job.recurrence]}
            </span>
          ) : null}
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
          <span className="relative flex shrink-0">
            <span
              className="flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[9px] font-medium text-primary-foreground shadow-[0_1px_2px_-1px_rgba(0,0,0,0.3)]"
              title={job.assignedTo.name ?? ""}
            >
              {initials(job.assignedTo.name)}
            </span>
            {!job.assignmentAckedAt ? (
              <span
                className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-chart-4 ring-2 ring-card"
                title="Pending acknowledgement"
              />
            ) : null}
          </span>
        ) : null}
      </div>
    </div>
  );
}
