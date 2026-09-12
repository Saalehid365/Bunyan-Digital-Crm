"use client";

import { useState, useTransition } from "react";
import { format, isPast, isToday } from "date-fns";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { createPersonalTask, togglePersonalTask, deletePersonalTask } from "@/server/actions/personal-tasks";

export type PersonalTaskItem = {
  id: string;
  title: string;
  done: boolean;
  dueDate: string | null;
};

export function PersonalTaskList({ tasks }: { tasks: PersonalTaskItem[] }) {
  const [newTitle, setNewTitle] = useState("");
  const [newDueDate, setNewDueDate] = useState("");
  const [pending, startTransition] = useTransition();
  const [addPending, startAddTransition] = useTransition();

  const open = tasks.filter((t) => !t.done);
  const done = tasks.filter((t) => t.done);

  function handleAdd() {
    const title = newTitle.trim();
    if (!title) return;
    const fd = new FormData();
    fd.set("title", title);
    fd.set("dueDate", newDueDate);
    startAddTransition(async () => {
      const result = await createPersonalTask(fd);
      if (result?.error) toast.error(result.error);
      else {
        setNewTitle("");
        setNewDueDate("");
      }
    });
  }

  function renderTask(task: PersonalTaskItem) {
    const dueDate = task.dueDate ? new Date(task.dueDate) : null;
    const overdue = dueDate && isPast(dueDate) && !isToday(dueDate) && !task.done;
    return (
      <li key={task.id} className="group flex items-center gap-2 rounded-[var(--radius-sm)] px-1 py-1.5 hover:bg-accent/40">
        <Checkbox
          checked={task.done}
          disabled={pending}
          onCheckedChange={() =>
            startTransition(() => {
              togglePersonalTask(task.id);
            })
          }
        />
        <span className={cn("flex-1 text-sm", task.done ? "text-muted-foreground line-through" : "text-foreground")}>
          {task.title}
        </span>
        {dueDate ? (
          <span
            className={cn(
              "shrink-0 font-mono text-[11px] tabular-nums",
              overdue ? "text-destructive" : "text-muted-foreground",
            )}
          >
            {format(dueDate, "d MMM")}
          </span>
        ) : null}
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 shrink-0 text-muted-foreground opacity-0 hover:text-destructive group-hover:opacity-100"
          disabled={pending}
          onClick={() =>
            startTransition(() => {
              deletePersonalTask(task.id);
            })
          }
        >
          <Trash2 className="h-3 w-3" />
        </Button>
      </li>
    );
  }

  return (
    <div className="space-y-3">
      {tasks.length === 0 ? (
        <p className="text-sm text-muted-foreground">Nothing on your list yet.</p>
      ) : (
        <ul className="space-y-0.5">
          {open.map(renderTask)}
          {done.length > 0 ? (
            <li className="pt-1 pl-1 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
              Done ({done.length})
            </li>
          ) : null}
          {done.map(renderTask)}
        </ul>
      )}

      <div className="flex items-center gap-1.5 pt-1">
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
        <input
          type="date"
          value={newDueDate}
          onChange={(e) => setNewDueDate(e.target.value)}
          className="h-8 w-[124px] shrink-0 rounded-md border border-input bg-transparent px-2 text-xs text-foreground outline-none [color-scheme:light] dark:[color-scheme:dark]"
        />
        <Button type="button" size="sm" variant="outline" disabled={addPending || !newTitle.trim()} onClick={handleAdd}>
          <Plus className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}
