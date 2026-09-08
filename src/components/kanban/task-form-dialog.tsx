"use client";

import { useActionState, useEffect } from "react";
import { Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PRIORITY_LABEL, TASK_STAGE_LABEL } from "@/lib/constants";
import { createTask, updateTask, deleteTask } from "@/server/actions/tasks";
import type { KanbanTask } from "./types";
import type { TaskStage } from "@prisma/client";

type AssignableUser = { id: string; name: string | null; email: string };
type ClientServiceOption = { id: string; name: string };

const initialState: { error?: string; id?: string; ok?: boolean } = {};

export function TaskFormDialog({
  open,
  onOpenChange,
  clientId,
  defaultStage,
  task,
  assignableUsers,
  clientServices,
  onDone,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  clientId: string;
  defaultStage: TaskStage;
  task?: KanbanTask | null;
  assignableUsers: AssignableUser[];
  clientServices: ClientServiceOption[];
  onDone: () => void;
}) {
  const isEdit = Boolean(task);

  const [state, formAction, pending] = useActionState(
    async (_prev: typeof initialState, formData: FormData): Promise<typeof initialState> => {
      if (isEdit && task) return await updateTask(task.id, formData);
      return await createTask(formData);
    },
    initialState,
  );

  useEffect(() => {
    if (state.ok || state.id) onDone();
  }, [state, onDone]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isEdit ? "Edit task" : "New task"}</DialogTitle>
        </DialogHeader>
        <form action={formAction} className="space-y-4">
          <input type="hidden" name="clientId" value={clientId} />
          {!isEdit ? <input type="hidden" name="stage" value={defaultStage} /> : null}

          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input id="title" name="title" defaultValue={task?.title} required autoFocus />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea id="description" name="description" rows={3} defaultValue={task?.description ?? ""} />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <Select name="priority" defaultValue={task?.priority ?? "MEDIUM"}>
                <SelectTrigger id="priority" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {Object.entries(PRIORITY_LABEL).map(([value, label]) => (
                    <SelectItem key={value} value={value}>
                      {label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="dueDate">Due date</Label>
              <Input
                id="dueDate"
                name="dueDate"
                type="date"
                defaultValue={task?.dueDate ? task.dueDate.slice(0, 10) : ""}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="assignedToId">Assignee</Label>
              <Select name="assignedToId" defaultValue={task?.assignedTo?.id ?? "unassigned"}>
                <SelectTrigger id="assignedToId" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="unassigned">Unassigned</SelectItem>
                  {assignableUsers.map((u) => (
                    <SelectItem key={u.id} value={u.id}>
                      {u.name || u.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {clientServices.length > 0 ? (
              <div className="space-y-2">
                <Label htmlFor="clientServiceId">Service</Label>
                <Select name="clientServiceId" defaultValue={task?.clientServiceId ?? "none"}>
                  <SelectTrigger id="clientServiceId" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {clientServices.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            ) : null}
          </div>

          {state?.error ? <p className="text-sm text-destructive">{state.error}</p> : null}

          <div className="flex items-center justify-between pt-1">
            {isEdit && task ? (
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="text-muted-foreground hover:text-destructive"
                onClick={async () => {
                  await deleteTask(task.id, clientId);
                  onDone();
                }}
              >
                <Trash2 className="h-3.5 w-3.5" /> Delete
              </Button>
            ) : (
              <span />
            )}
            <Button type="submit" disabled={pending}>
              {pending ? "Saving…" : isEdit ? "Save changes" : `Add to ${TASK_STAGE_LABEL[defaultStage]}`}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
