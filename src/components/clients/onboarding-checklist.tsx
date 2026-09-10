"use client";

import { useState, useTransition } from "react";
import { Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { addOnboardingTask, toggleOnboardingTask, deleteOnboardingTask } from "@/server/actions/onboarding";

type OnboardingTask = { id: string; title: string; done: boolean };

export function OnboardingChecklist({ clientId, tasks }: { clientId: string; tasks: OnboardingTask[] }) {
  const [newTitle, setNewTitle] = useState("");
  const [pending, startTransition] = useTransition();
  const [addPending, startAddTransition] = useTransition();

  function handleAdd() {
    const title = newTitle.trim();
    if (!title) return;
    const fd = new FormData();
    fd.set("clientId", clientId);
    fd.set("title", title);
    startAddTransition(async () => {
      const result = await addOnboardingTask(fd);
      if (result?.error) toast.error(result.error);
      else setNewTitle("");
    });
  }

  return (
    <div className="space-y-3">
      <ul className="space-y-1">
        {tasks.map((task) => (
          <li
            key={task.id}
            className="group flex items-center gap-2 rounded-[var(--radius-sm)] px-1 py-1.5 hover:bg-accent/40"
          >
            <Checkbox
              checked={task.done}
              disabled={pending}
              onCheckedChange={() =>
                startTransition(() => {
                  toggleOnboardingTask(task.id);
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
            <Button
              variant="ghost"
              size="icon"
              className="h-6 w-6 shrink-0 text-muted-foreground opacity-0 hover:text-destructive group-hover:opacity-100"
              disabled={pending}
              onClick={() =>
                startTransition(() => {
                  deleteOnboardingTask(task.id);
                })
              }
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </li>
        ))}
      </ul>

      <div className="flex items-center gap-2 pt-1">
        <Input
          value={newTitle}
          onChange={(e) => setNewTitle(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleAdd();
            }
          }}
          placeholder="Add a checklist item…"
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
    </div>
  );
}
