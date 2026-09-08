"use client";

import { useActionState } from "react";
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
import { PRIORITY_LABEL, RECURRENCE_LABEL } from "@/lib/constants";
import { updateJob } from "@/server/actions/jobs";
import type { KanbanJob } from "./types";

type AssignableUser = { id: string; name: string | null; email: string };
type ClientServiceOption = { id: string; name: string };

const initialState: { error?: string; ok?: boolean } = {};

export function JobEditForm({
  job,
  assignableUsers,
  clientServices,
}: {
  job: KanbanJob;
  assignableUsers: AssignableUser[];
  clientServices: ClientServiceOption[];
}) {
  const [state, formAction, pending] = useActionState(
    async (_prev: typeof initialState, formData: FormData): Promise<typeof initialState> => {
      const result = await updateJob(job.id, formData);
      return result ?? {};
    },
    initialState,
  );

  return (
    <form action={formAction} className="space-y-4">
      <input type="hidden" name="clientId" value={job.clientId} />

      <div className="space-y-2">
        <Label htmlFor={`title-${job.id}`}>Title</Label>
        <Input id={`title-${job.id}`} name="title" defaultValue={job.title} required />
      </div>

      <div className="space-y-2">
        <Label htmlFor={`description-${job.id}`}>Description</Label>
        <Textarea id={`description-${job.id}`} name="description" rows={3} defaultValue={job.description ?? ""} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor={`priority-${job.id}`}>Priority</Label>
          <Select name="priority" defaultValue={job.priority}>
            <SelectTrigger id={`priority-${job.id}`} className="w-full">
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
          <Label htmlFor={`recurrence-${job.id}`}>Repeats</Label>
          <Select name="recurrence" defaultValue={job.recurrence}>
            <SelectTrigger id={`recurrence-${job.id}`} className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(RECURRENCE_LABEL).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor={`dueDate-${job.id}`}>Due date</Label>
          <Input
            id={`dueDate-${job.id}`}
            name="dueDate"
            type="date"
            defaultValue={job.dueDate ? job.dueDate.slice(0, 10) : ""}
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor={`assignedToId-${job.id}`}>Assignee</Label>
          <Select name="assignedToId" defaultValue={job.assignedTo?.id ?? "unassigned"}>
            <SelectTrigger id={`assignedToId-${job.id}`} className="w-full">
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
      </div>

      {clientServices.length > 0 ? (
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor={`clientServiceId-${job.id}`}>Service</Label>
            <Select name="clientServiceId" defaultValue={job.clientServiceId ?? "none"}>
              <SelectTrigger id={`clientServiceId-${job.id}`} className="w-full">
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
        </div>
      ) : null}

      {state?.error ? <p className="text-sm text-destructive">{state.error}</p> : null}

      <div className="flex justify-end">
        <Button type="submit" size="sm" disabled={pending}>
          {pending ? "Saving…" : "Save"}
        </Button>
      </div>
    </form>
  );
}
