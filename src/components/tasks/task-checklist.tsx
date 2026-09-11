"use client";

import { useState, useTransition } from "react";
import { Clock, Plus, Trash2, AlignLeft } from "lucide-react";
import { toast } from "sonner";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatMinutes } from "@/lib/constants";
import { addTask, toggleTask, deleteTask, updateTaskDescription } from "@/server/actions/subtasks";
import { TimeEntryDialog } from "./time-entry-dialog";
import type { JobTask } from "@/components/kanban/types";

function TaskDescriptionField({ taskId, description }: { taskId: string; description: string | null }) {
  const [value, setValue] = useState(description ?? "");
  const [pending, startTransition] = useTransition();

  function save() {
    if (value.trim() === (description ?? "").trim()) return;
    startTransition(async () => {
      const result = await updateTaskDescription(taskId, value);
      if (result?.error) toast.error(result.error);
    });
  }

  return (
    <Textarea
      value={value}
      onChange={(e) => setValue(e.target.value)}
      onBlur={save}
      disabled={pending}
      placeholder="Add details about this task…"
      rows={2}
      className="text-sm"
    />
  );
}

export function TaskChecklist({
  jobId,
  tasks,
  currentUserId,
  isAdmin,
}: {
  jobId: string;
  tasks: JobTask[];
  currentUserId: string;
  isAdmin: boolean;
}) {
  const [newTitle, setNewTitle] = useState("");
  const [newDescription, setNewDescription] = useState("");
  const [showNewDetails, setShowNewDetails] = useState(false);
  const [expandedTaskId, setExpandedTaskId] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const [addPending, startAddTransition] = useTransition();
  const [timeDialogTaskId, setTimeDialogTaskId] = useState<string | null>(null);

  const timeDialogTask = tasks.find((t) => t.id === timeDialogTaskId) ?? null;
  const totalMinutes = tasks.reduce((sum, t) => sum + t.totalMinutes, 0);

  function handleAdd() {
    const title = newTitle.trim();
    if (!title) return;
    const fd = new FormData();
    fd.set("jobId", jobId);
    fd.set("title", title);
    fd.set("description", newDescription.trim());
    startAddTransition(async () => {
      const result = await addTask(fd);
      if (result?.error) toast.error(result.error);
      else {
        setNewTitle("");
        setNewDescription("");
        setShowNewDetails(false);
      }
    });
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          Tasks {tasks.length > 0 ? `(${tasks.filter((t) => t.done).length}/${tasks.length})` : ""}
        </p>
        {totalMinutes > 0 ? (
          <span className="inline-flex items-center gap-1 font-mono text-xs tabular-nums text-muted-foreground">
            <Clock className="h-3 w-3" />
            {formatMinutes(totalMinutes)} total
          </span>
        ) : null}
      </div>

      <ul className="space-y-1">
        {tasks.map((task) => {
          const expanded = expandedTaskId === task.id;
          return (
            <li key={task.id} className="rounded-[var(--radius-sm)] hover:bg-accent/40">
              <div className="group flex items-center gap-2 px-1 py-1.5">
                <Checkbox
                  checked={task.done}
                  disabled={pending}
                  onCheckedChange={() =>
                    startTransition(() => {
                      toggleTask(task.id);
                    })
                  }
                />
                <span
                  className={cn(
                    "flex-1 text-sm",
                    task.done ? "text-muted-foreground line-through" : "text-foreground",
                  )}
                >
                  {task.title}
                </span>
                <button
                  type="button"
                  onClick={() => setExpandedTaskId(expanded ? null : task.id)}
                  title={task.description ? "View details" : "Add details"}
                  className={cn(
                    "flex h-6 w-6 shrink-0 items-center justify-center rounded-[var(--radius-sm)] transition-colors",
                    expanded
                      ? "bg-accent text-foreground"
                      : task.description
                        ? "text-muted-foreground hover:text-foreground"
                        : "text-muted-foreground opacity-0 hover:text-foreground group-hover:opacity-100",
                  )}
                >
                  <AlignLeft className="h-3 w-3" />
                </button>
                <button
                  type="button"
                  onClick={() => setTimeDialogTaskId(task.id)}
                  className={cn(
                    "inline-flex items-center gap-1 rounded-[var(--radius-sm)] px-1.5 py-0.5 font-mono text-[11px] tabular-nums",
                    task.totalMinutes > 0
                      ? "text-foreground"
                      : "text-muted-foreground opacity-0 group-hover:opacity-100",
                  )}
                >
                  <Clock className="h-3 w-3" />
                  {task.totalMinutes > 0 ? formatMinutes(task.totalMinutes) : "Log time"}
                </button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-6 w-6 shrink-0 text-muted-foreground opacity-0 hover:text-destructive group-hover:opacity-100"
                  disabled={pending}
                  onClick={() =>
                    startTransition(() => {
                      deleteTask(task.id);
                    })
                  }
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
              {expanded ? (
                <div className="px-1 pb-2 pl-7">
                  <TaskDescriptionField taskId={task.id} description={task.description} />
                </div>
              ) : null}
            </li>
          );
        })}
      </ul>

      <div className="space-y-1.5 pt-1">
        <div className="flex items-center gap-2">
          <Input
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                handleAdd();
              }
            }}
            placeholder="Add a task…"
            className="h-8 text-sm"
          />
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={addPending || !newTitle.trim()}
            onClick={handleAdd}
          >
            <Plus className="h-3.5 w-3.5" />
          </Button>
        </div>
        {showNewDetails ? (
          <Textarea
            value={newDescription}
            onChange={(e) => setNewDescription(e.target.value)}
            placeholder="Add details about this task…"
            rows={2}
            className="text-sm"
            autoFocus
          />
        ) : (
          <button
            type="button"
            onClick={() => setShowNewDetails(true)}
            className="inline-flex items-center gap-1 pl-0.5 text-xs text-muted-foreground hover:text-foreground"
          >
            <AlignLeft className="h-3 w-3" />
            Add details
          </button>
        )}
      </div>

      {timeDialogTask ? (
        <TimeEntryDialog
          task={timeDialogTask}
          open={Boolean(timeDialogTask)}
          onOpenChange={(open) => !open && setTimeDialogTaskId(null)}
          currentUserId={currentUserId}
          isAdmin={isAdmin}
        />
      ) : null}
    </div>
  );
}
