"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { isPast, isToday, format } from "date-fns";
import { AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { PRIORITY_LABEL } from "@/lib/constants";
import type { KanbanTask } from "./types";
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

export function TaskCard({
  task,
  showClient,
  onClick,
  overlay,
}: {
  task: KanbanTask;
  showClient: boolean;
  onClick?: () => void;
  overlay?: boolean;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
    data: { stage: task.stage },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  const dueDate = task.dueDate ? new Date(task.dueDate) : null;
  const overdue = dueDate && isPast(dueDate) && !isToday(dueDate) && task.stage !== "DONE";

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
        <p className="text-sm font-medium leading-snug text-foreground">{task.title}</p>
        <span
          className={cn("mt-1 h-1.5 w-1.5 shrink-0 rounded-full", PRIORITY_DOT[task.priority])}
          title={PRIORITY_LABEL[task.priority]}
        />
      </div>

      {showClient || task.serviceTypeName ? (
        <div className="mb-2 flex flex-wrap items-center gap-1.5">
          {showClient ? (
            <span className="text-xs text-muted-foreground">{task.clientName}</span>
          ) : null}
          {task.serviceTypeName ? (
            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
              <span
                className="h-1.5 w-1.5 rounded-full"
                style={{ backgroundColor: task.serviceTypeColor ?? "var(--muted-foreground)" }}
              />
              {task.serviceTypeName}
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
        {task.assignedTo ? (
          <span
            className="flex h-5 w-5 items-center justify-center rounded-full bg-primary/15 text-[9px] font-medium text-primary"
            title={task.assignedTo.name ?? ""}
          >
            {initials(task.assignedTo.name)}
          </span>
        ) : null}
      </div>
    </div>
  );
}
