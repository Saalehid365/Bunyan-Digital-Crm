"use client";

import { useState, useTransition } from "react";
import { addDays, format, isPast, isToday } from "date-fns";
import { Plus, Trash2, Clock3 } from "lucide-react";
import { toast } from "sonner";
import Link from "next/link";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { EmptyState } from "@/components/empty-state";
import { cn } from "@/lib/utils";
import { createFollowUp, toggleFollowUp, rescheduleFollowUp, deleteFollowUp } from "@/server/actions/follow-ups";

export type FollowUpItem = {
  id: string;
  title: string;
  notes: string | null;
  dueDate: string;
  done: boolean;
  clientId: string | null;
  clientName: string | null;
  assignedToName: string | null;
};

type ClientOption = { id: string; name: string };
type AssignableUser = { id: string; name: string | null; email: string };

function groupLabel(dueDate: Date): "Overdue" | "Today" | "Upcoming" {
  if (isPast(dueDate) && !isToday(dueDate)) return "Overdue";
  if (isToday(dueDate)) return "Today";
  return "Upcoming";
}

export function FollowUpList({
  followUps,
  clients,
  assignableUsers,
  fixedClientId,
  currentUserId,
  showClient = true,
}: {
  followUps: FollowUpItem[];
  clients?: ClientOption[];
  assignableUsers?: AssignableUser[];
  fixedClientId?: string;
  currentUserId: string;
  showClient?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [dueDate, setDueDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [clientId, setClientId] = useState("none");
  const [assignedToId, setAssignedToId] = useState(currentUserId);
  const [pending, startTransition] = useTransition();
  const [addPending, startAddTransition] = useTransition();

  const openItems = followUps.filter((f) => !f.done);
  const doneItems = followUps.filter((f) => f.done);

  const groups: Record<"Overdue" | "Today" | "Upcoming", FollowUpItem[]> = {
    Overdue: [],
    Today: [],
    Upcoming: [],
  };
  for (const f of openItems) groups[groupLabel(new Date(f.dueDate))].push(f);

  function handleAdd() {
    const trimmed = title.trim();
    if (!trimmed || !dueDate) return;
    const fd = new FormData();
    fd.set("title", trimmed);
    fd.set("notes", notes.trim());
    fd.set("dueDate", dueDate);
    fd.set("clientId", fixedClientId ?? clientId);
    fd.set("assignedToId", assignedToId);
    startAddTransition(async () => {
      const result = await createFollowUp(fd);
      if (result?.error) toast.error(result.error);
      else {
        setTitle("");
        setNotes("");
        setDueDate(format(new Date(), "yyyy-MM-dd"));
        setClientId("none");
        setAssignedToId(currentUserId);
        setOpen(false);
      }
    });
  }

  function snooze(id: string, days: number) {
    startTransition(async () => {
      const result = await rescheduleFollowUp(id, format(addDays(new Date(), days), "yyyy-MM-dd"));
      if (result?.error) toast.error(result.error);
    });
  }

  function renderRow(item: FollowUpItem) {
    const due = new Date(item.dueDate);
    const overdue = !item.done && isPast(due) && !isToday(due);
    return (
      <li key={item.id} className="group flex items-start gap-2 rounded-[var(--radius-sm)] px-1 py-1.5 hover:bg-accent/40">
        <Checkbox
          checked={item.done}
          disabled={pending}
          className="mt-0.5"
          onCheckedChange={() =>
            startTransition(async () => {
              const result = await toggleFollowUp(item.id);
              if (result?.error) toast.error(result.error);
            })
          }
        />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
            <span className={cn("text-sm", item.done ? "text-muted-foreground line-through" : "text-foreground")}>
              {item.title}
            </span>
            {showClient && item.clientName ? (
              <Link
                href={`/clients/${item.clientId}`}
                className="text-xs text-primary hover:underline"
                onClick={(e) => e.stopPropagation()}
              >
                {item.clientName}
              </Link>
            ) : null}
          </div>
          {item.notes ? <p className="mt-0.5 text-xs text-muted-foreground">{item.notes}</p> : null}
          {item.assignedToName ? (
            <p className="mt-0.5 text-[11px] text-muted-foreground">For {item.assignedToName}</p>
          ) : null}
        </div>
        <span className={cn("shrink-0 font-mono text-[11px] tabular-nums", overdue ? "text-destructive" : "text-muted-foreground")}>
          {format(due, "d MMM")}
        </span>
        {!item.done ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6 shrink-0 text-muted-foreground opacity-0 hover:text-foreground group-hover:opacity-100"
                title="Snooze"
              >
                <Clock3 className="h-3 w-3" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-36">
              <DropdownMenuItem onClick={() => snooze(item.id, 1)}>Tomorrow</DropdownMenuItem>
              <DropdownMenuItem onClick={() => snooze(item.id, 7)}>Next week</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : null}
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6 shrink-0 text-muted-foreground opacity-0 hover:text-destructive group-hover:opacity-100"
          disabled={pending}
          onClick={() =>
            startTransition(async () => {
              const result = await deleteFollowUp(item.id);
              if (result?.error) toast.error(result.error);
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
      {followUps.length === 0 ? (
        <EmptyState
          icon={Clock3}
          title="No follow-ups"
          description="Add a reminder and it'll show up here when it's due."
        />
      ) : (
        <div className="space-y-3">
          {(["Overdue", "Today", "Upcoming"] as const).map((label) =>
            groups[label].length > 0 ? (
              <div key={label}>
                <p
                  className={cn(
                    "px-1 text-[10px] font-medium uppercase tracking-wide",
                    label === "Overdue" ? "text-destructive" : "text-muted-foreground",
                  )}
                >
                  {label}
                </p>
                <ul className="space-y-0.5">{groups[label].map(renderRow)}</ul>
              </div>
            ) : null,
          )}
          {doneItems.length > 0 ? (
            <div>
              <p className="px-1 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                Done ({doneItems.length})
              </p>
              <ul className="space-y-0.5">{doneItems.map(renderRow)}</ul>
            </div>
          ) : null}
        </div>
      )}

      {open ? (
        <div className="space-y-2 rounded-[var(--radius-md)] border border-border p-3">
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="What do you need to follow up on?"
            className="h-8 text-sm"
            autoFocus
          />
          <div className="flex flex-wrap items-center gap-2">
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              className="h-8 w-[124px] shrink-0 rounded-md border border-input bg-transparent px-2 text-xs text-foreground outline-none [color-scheme:light] dark:[color-scheme:dark]"
            />
            {!fixedClientId && clients && clients.length > 0 ? (
              <Select value={clientId} onValueChange={setClientId}>
                <SelectTrigger className="h-8 w-40 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No client</SelectItem>
                  {clients.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : null}
            {assignableUsers && assignableUsers.length > 1 ? (
              <Select value={assignedToId} onValueChange={setAssignedToId}>
                <SelectTrigger className="h-8 w-40 text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {assignableUsers.map((u) => (
                    <SelectItem key={u.id} value={u.id}>
                      {u.id === currentUserId ? "Me" : u.name || u.email}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ) : null}
          </div>
          <Textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Notes (optional)…"
            rows={2}
            className="text-sm"
          />
          <div className="flex items-center justify-end gap-2">
            <Button type="button" size="sm" variant="ghost" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="button" size="sm" disabled={addPending || !title.trim() || !dueDate} onClick={handleAdd}>
              Add follow-up
            </Button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
        >
          <Plus className="h-3.5 w-3.5" /> Add follow-up
        </button>
      )}
    </div>
  );
}
