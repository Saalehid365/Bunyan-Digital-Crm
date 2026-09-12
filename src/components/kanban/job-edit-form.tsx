"use client";

import { useActionState } from "react";
import { Flag, User, CalendarDays, Repeat, Tag, Trash2, Flame, Receipt, FileText } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { PRIORITY_LABEL, RECURRENCE_LABEL, PRIORITY_DOT_CLASS, QUOTE_STATUS_LABEL, INVOICE_STATUS_LABEL } from "@/lib/constants";
import { INVOICE_STATUS_FILL } from "@/components/billing/status-cells";
import { updateJob, deleteJob } from "@/server/actions/jobs";
import { initials } from "./job-card";
import type { KanbanJob } from "./types";
import type { QuoteStatus, InvoiceStatus } from "@prisma/client";

type AssignableUser = { id: string; name: string | null; email: string };
type ClientServiceOption = { id: string; name: string };
type QuoteOption = { id: string; number: number; status: QuoteStatus };
type InvoiceOption = { id: string; number: number; status: InvoiceStatus };

const initialState: { error?: string; ok?: boolean } = {};

const sidebarTrigger =
  "h-7 w-full min-w-0 justify-start gap-1.5 rounded-md border-none bg-transparent px-1.5 text-xs font-medium text-foreground shadow-none hover:bg-accent/60 data-[state=open]:bg-accent/60";

function PropertyRow({
  icon: Icon,
  label,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-1.5" title={label}>
      <Icon className="h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-hidden />
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}

export function JobEditForm({
  job,
  assignableUsers,
  clientServices,
  quotes,
  invoices,
  onDeleted,
}: {
  job: KanbanJob;
  assignableUsers: AssignableUser[];
  clientServices: ClientServiceOption[];
  quotes: QuoteOption[];
  invoices: InvoiceOption[];
  onDeleted: () => void;
}) {
  const [state, formAction, pending] = useActionState(
    async (_prev: typeof initialState, formData: FormData): Promise<typeof initialState> => {
      const result = await updateJob(job.id, formData);
      return result ?? {};
    },
    initialState,
  );

  return (
    <form action={formAction}>
      <input type="hidden" name="clientId" value={job.clientId} />

      <div className="grid grid-cols-1 sm:grid-cols-[1fr_240px]">
        <div className="space-y-4 px-6 py-5 sm:border-r sm:border-border">
          <input
            name="title"
            defaultValue={job.title}
            required
            aria-label="Job title"
            className="w-full border-0 border-b border-transparent bg-transparent px-0 pb-1.5 text-xl font-semibold tracking-tight text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-border"
          />
          <Textarea
            name="description"
            rows={5}
            aria-label="Description"
            defaultValue={job.description ?? ""}
            placeholder="Add a description…"
            className="resize-none border-transparent bg-transparent px-0 py-0 text-sm leading-relaxed shadow-none transition-colors focus-visible:ring-0 dark:bg-transparent"
          />
        </div>

        <div className="space-y-3 bg-muted/20 px-4 py-5">
          <p className="px-1.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
            Properties
          </p>

          <PropertyRow icon={Flag} label="Priority">
            <Select name="priority" defaultValue={job.priority}>
              <SelectTrigger className={sidebarTrigger} aria-label="Priority">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(PRIORITY_LABEL).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    <span className="inline-flex items-center gap-1.5">
                      {value === "URGENT" ? (
                        <Flame className="h-3 w-3 text-destructive" />
                      ) : (
                        <span
                          className={`h-1.5 w-1.5 rounded-full ${PRIORITY_DOT_CLASS[value as keyof typeof PRIORITY_DOT_CLASS]}`}
                        />
                      )}
                      <span className={value === "URGENT" ? "font-medium text-destructive" : undefined}>
                        {label}
                      </span>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </PropertyRow>

          <PropertyRow icon={User} label="Assignee">
            <div className="flex items-center gap-1.5">
              <Select name="assignedToId" defaultValue={job.assignedTo?.id} required>
                <SelectTrigger className={sidebarTrigger} aria-label="Assignee">
                  <SelectValue placeholder="Choose someone" />
                </SelectTrigger>
                <SelectContent>
                  {assignableUsers.map((u) => (
                    <SelectItem key={u.id} value={u.id}>
                      <span className="inline-flex items-center gap-1.5">
                        <span className="flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[8px] font-medium text-primary-foreground">
                          {initials(u.name)}
                        </span>
                        {u.name || u.email}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {job.assignedTo && !job.assignmentAckedAt ? (
                <span
                  className="shrink-0 rounded-full bg-chart-4/15 px-1.5 py-0.5 text-[10px] font-medium text-[var(--chart-4)]"
                  title="Not yet acknowledged by the assignee"
                >
                  Pending
                </span>
              ) : null}
            </div>
          </PropertyRow>

          <PropertyRow icon={CalendarDays} label="Due">
            <input
              name="dueDate"
              type="date"
              aria-label="Due date"
              defaultValue={job.dueDate ? job.dueDate.slice(0, 10) : ""}
              className="h-7 w-full min-w-0 rounded-md bg-transparent px-1.5 text-xs text-foreground outline-none transition-colors hover:bg-accent/60 [color-scheme:light] dark:[color-scheme:dark]"
            />
          </PropertyRow>

          <PropertyRow icon={Repeat} label="Repeats">
            <Select name="recurrence" defaultValue={job.recurrence}>
              <SelectTrigger className={sidebarTrigger} aria-label="Repeats">
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
          </PropertyRow>

          {clientServices.length > 0 ? (
            <PropertyRow icon={Tag} label="Service">
              <Select name="clientServiceId" defaultValue={job.clientServiceId ?? "none"}>
                <SelectTrigger className={sidebarTrigger} aria-label="Service">
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
            </PropertyRow>
          ) : null}

          {job.recurrence === "NONE" ? (
            <>
              <PropertyRow icon={FileText} label="Quote">
                <Select name="quoteId" defaultValue={job.linkedQuote?.id ?? "none"}>
                  <SelectTrigger className={sidebarTrigger} aria-label="Quote">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    {quotes.map((q) => (
                      <SelectItem key={q.id} value={q.id}>
                        {`Q-${String(q.number).padStart(4, "0")}`} · {QUOTE_STATUS_LABEL[q.status]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </PropertyRow>

              <PropertyRow icon={Receipt} label="Invoice">
                <div className="flex items-center gap-1.5">
                  <Select name="invoiceId" defaultValue={job.linkedInvoice?.id ?? "none"}>
                    <SelectTrigger className={sidebarTrigger} aria-label="Invoice">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">None</SelectItem>
                      {invoices.map((i) => (
                        <SelectItem key={i.id} value={i.id}>
                          {`INV-${String(i.number).padStart(4, "0")}`}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {job.linkedInvoice ? (
                    <span
                      className={cn(
                        "shrink-0 rounded-full px-1.5 py-0.5 text-[10px] font-semibold",
                        INVOICE_STATUS_FILL[job.linkedInvoice.status],
                      )}
                    >
                      {INVOICE_STATUS_LABEL[job.linkedInvoice.status]}
                    </span>
                  ) : null}
                </div>
              </PropertyRow>
            </>
          ) : null}
        </div>
      </div>

      {state?.error ? <p className="px-6 pt-2 text-sm text-destructive">{state.error}</p> : null}

      <div className="flex items-center justify-between border-t border-border bg-muted/20 px-6 py-3">
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-7 px-2 text-xs text-muted-foreground hover:text-destructive"
          onClick={async () => {
            await deleteJob(job.id, job.clientId);
            onDeleted();
          }}
        >
          <Trash2 className="h-3.5 w-3.5" /> Delete
        </Button>
        <Button type="submit" size="sm" disabled={pending}>
          {pending ? "Saving…" : "Save"}
        </Button>
      </div>
    </form>
  );
}
