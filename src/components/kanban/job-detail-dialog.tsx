"use client";

import { X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { JOB_STAGE_LABEL, PRIORITY_DOT_CLASS } from "@/lib/constants";
import { JobEditForm } from "./job-edit-form";
import { AcknowledgeAssignmentBanner } from "./acknowledge-assignment-banner";
import { TaskChecklist } from "@/components/tasks/task-checklist";
import type { KanbanJob } from "./types";
import type { QuoteStatus, InvoiceStatus } from "@prisma/client";

type AssignableUser = { id: string; name: string | null; email: string };
type ClientServiceOption = { id: string; name: string };
type QuoteOption = { id: string; number: number; status: QuoteStatus };
type InvoiceOption = { id: string; number: number; status: InvoiceStatus };

export function JobDetailDialog({
  job,
  open,
  onOpenChange,
  assignableUsers,
  clientServices,
  quotes,
  invoices,
  currentUserId,
  isAdmin,
}: {
  job: KanbanJob | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  assignableUsers: AssignableUser[];
  clientServices: ClientServiceOption[];
  quotes: QuoteOption[];
  invoices: InvoiceOption[];
  currentUserId: string;
  isAdmin: boolean;
}) {
  if (!job) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        className="flex max-h-[85vh] w-full flex-col gap-0 overflow-hidden p-0 shadow-[0_32px_80px_-20px_rgba(0,0,0,0.45)] ring-1 ring-foreground/[0.07] sm:max-w-3xl"
      >
        <div className={cn("h-1 w-full shrink-0 rounded-t-xl", PRIORITY_DOT_CLASS[job.priority])} />

        <div className="flex shrink-0 items-center justify-between gap-3 border-b border-border px-6 py-3.5">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-1.5 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {job.clientName}
              {job.serviceTypeName ? (
                <>
                  <span aria-hidden>·</span>
                  <span
                    className="h-1.5 w-1.5 rounded-full"
                    style={{ backgroundColor: job.serviceTypeColor ?? "var(--muted-foreground)" }}
                  />
                  {job.serviceTypeName}
                </>
              ) : null}
            </DialogTitle>
          </DialogHeader>
          <div className="flex items-center gap-2">
            <span className="rounded-full border border-border bg-background px-2 py-0.5 text-[10px] font-medium normal-case tracking-normal text-muted-foreground">
              {JOB_STAGE_LABEL[job.stage]}
            </span>
            <button
              type="button"
              onClick={() => onOpenChange(false)}
              aria-label="Close"
              className="flex h-6 w-6 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-accent/60 hover:text-foreground"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>

        {job.assignedTo?.id === currentUserId && !job.assignmentAckedAt ? (
          <AcknowledgeAssignmentBanner jobId={job.id} />
        ) : null}

        <div className="overflow-y-auto">
          <JobEditForm
            job={job}
            assignableUsers={assignableUsers}
            clientServices={clientServices}
            quotes={quotes}
            invoices={invoices}
            onDeleted={() => onOpenChange(false)}
          />

          <Separator />

          <div className="px-6 py-5">
            <TaskChecklist
              jobId={job.id}
              tasks={job.tasks}
              currentUserId={currentUserId}
              isAdmin={isAdmin}
            />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
