"use client";

import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { Plus } from "lucide-react";
import { cn } from "@/lib/utils";
import { TaskCard } from "./task-card";
import type { KanbanTask } from "./types";
import type { TaskStage } from "@prisma/client";

export function Column({
  stage,
  label,
  tasks,
  showClient,
  onAddTask,
  onTaskClick,
}: {
  stage: TaskStage;
  label: string;
  tasks: KanbanTask[];
  showClient: boolean;
  onAddTask?: (stage: TaskStage) => void;
  onTaskClick: (task: KanbanTask) => void;
}) {
  const { setNodeRef, isOver } = useDroppable({ id: `col-${stage}` });

  return (
    <div className="flex w-72 shrink-0 flex-col">
      <div className="mb-3 flex items-center justify-between px-0.5">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-medium text-foreground">{label}</h3>
          <span className="font-mono text-xs tabular-nums text-muted-foreground">{tasks.length}</span>
        </div>
        {onAddTask ? (
          <button
            onClick={() => onAddTask(stage)}
            className="rounded-[var(--radius-sm)] p-1 text-muted-foreground hover:bg-accent hover:text-foreground"
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
        ) : null}
      </div>
      <div className="mb-2 h-px bg-border" />
      <div
        ref={setNodeRef}
        className={cn(
          "flex min-h-24 flex-1 flex-col gap-2 rounded-[var(--radius-lg)] p-1 transition-colors",
          isOver ? "bg-accent/40" : "",
        )}
      >
        <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
          {tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              showClient={showClient}
              onClick={() => onTaskClick(task)}
            />
          ))}
        </SortableContext>
      </div>
    </div>
  );
}
