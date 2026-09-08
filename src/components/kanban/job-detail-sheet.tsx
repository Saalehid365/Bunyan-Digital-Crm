"use client";

import { Trash2 } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetFooter,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { deleteJob } from "@/server/actions/jobs";
import { JobEditForm } from "./job-edit-form";
import { TaskChecklist } from "@/components/tasks/task-checklist";
import type { KanbanJob } from "./types";

type AssignableUser = { id: string; name: string | null; email: string };
type ClientServiceOption = { id: string; name: string };

export function JobDetailSheet({
  job,
  open,
  onOpenChange,
  assignableUsers,
  clientServices,
  currentUserId,
  isAdmin,
}: {
  job: KanbanJob | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  assignableUsers: AssignableUser[];
  clientServices: ClientServiceOption[];
  currentUserId: string;
  isAdmin: boolean;
}) {
  if (!job) return null;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex w-full flex-col overflow-y-auto sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Job details</SheetTitle>
        </SheetHeader>

        <div className="flex-1 space-y-6 px-4 pb-4">
          <JobEditForm job={job} assignableUsers={assignableUsers} clientServices={clientServices} />

          <Separator />

          <TaskChecklist
            jobId={job.id}
            tasks={job.tasks}
            currentUserId={currentUserId}
            isAdmin={isAdmin}
          />
        </div>

        <SheetFooter>
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:text-destructive"
            onClick={async () => {
              await deleteJob(job.id, job.clientId);
              onOpenChange(false);
            }}
          >
            <Trash2 className="h-3.5 w-3.5" /> Delete job
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
