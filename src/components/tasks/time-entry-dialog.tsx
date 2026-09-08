"use client";

import { useActionState, useState } from "react";
import { format } from "date-fns";
import { Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { addTimeEntry, deleteTimeEntry } from "@/server/actions/time-entries";
import { formatMinutes } from "@/lib/constants";
import type { JobTask } from "@/components/kanban/types";

const initialState: { error?: string; ok?: boolean } = {};

export function TimeEntryDialog({
  task,
  open,
  onOpenChange,
  currentUserId,
  isAdmin,
}: {
  task: JobTask;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentUserId: string;
  isAdmin: boolean;
}) {
  const [state, formAction, pending] = useActionState(
    async (_prev: typeof initialState, formData: FormData): Promise<typeof initialState> => {
      const result = await addTimeEntry(formData);
      return result ?? {};
    },
    initialState,
  );
  const [deleting, setDeleting] = useState<string | null>(null);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Log time — {task.title}</DialogTitle>
        </DialogHeader>

        <form action={formAction} className="space-y-4">
          <input type="hidden" name="taskId" value={task.id} />
          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="hours">Hours</Label>
              <Input id="hours" name="hours" type="number" min="0" max="24" defaultValue="0" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="minutes">Minutes</Label>
              <Input id="minutes" name="minutes" type="number" min="0" max="59" step="5" defaultValue="0" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="workDate">Date</Label>
              <Input id="workDate" name="workDate" type="date" defaultValue={format(new Date(), "yyyy-MM-dd")} required />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="note">Note (optional)</Label>
            <Input id="note" name="note" placeholder="What did you work on?" />
          </div>
          {state?.error ? <p className="text-sm text-destructive">{state.error}</p> : null}
          <div className="flex justify-end">
            <Button type="submit" disabled={pending}>
              {pending ? "Logging…" : "Log time"}
            </Button>
          </div>
        </form>

        {task.timeEntries.length > 0 ? (
          <div className="border-t border-border pt-3">
            <p className="mb-2 text-xs font-medium text-muted-foreground">
              Total: {formatMinutes(task.timeEntries.reduce((s, e) => s + e.minutes, 0))}
            </p>
            <ul className="max-h-40 space-y-1.5 overflow-y-auto">
              {task.timeEntries.map((entry) => (
                <li key={entry.id} className="flex items-center justify-between gap-2 text-sm">
                  <div className="min-w-0">
                    <span className="font-mono tabular-nums text-foreground">{formatMinutes(entry.minutes)}</span>{" "}
                    <span className="text-muted-foreground">
                      · {entry.userName ?? "Someone"} · {format(new Date(entry.workDate), "d MMM")}
                    </span>
                    {entry.note ? (
                      <p className="truncate text-xs text-muted-foreground">{entry.note}</p>
                    ) : null}
                  </div>
                  {isAdmin || entry.userId === currentUserId ? (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 shrink-0 text-muted-foreground hover:text-destructive"
                      disabled={deleting === entry.id}
                      onClick={async () => {
                        setDeleting(entry.id);
                        await deleteTimeEntry(entry.id);
                        setDeleting(null);
                      }}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  ) : null}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
