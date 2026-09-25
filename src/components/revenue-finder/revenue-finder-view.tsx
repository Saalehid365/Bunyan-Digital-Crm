"use client";

import { useState, useTransition } from "react";
import Link from "next/link";
import { format } from "date-fns";
import { ExternalLink, UserPlus } from "lucide-react";
import { toast } from "sonner";
import type { RevenueFinderStatus } from "@prisma/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from "@/components/ui/sheet";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { cn } from "@/lib/utils";
import {
  REVENUE_FINDER_STATUSES,
  REVENUE_FINDER_STATUS_LABEL,
  REVENUE_FINDER_STATUS_FILL,
  safeStoreHref,
} from "@/lib/revenue-finder";
import { updateRevenueFinderApplication, convertRevenueFinderToClient } from "@/server/actions/revenue-finder";

export type ApplicationRow = {
  id: string;
  createdAt: Date;
  name: string;
  role: string;
  email: string;
  phone: string | null;
  storeUrl: string;
  platform: string;
  market: string;
  monthlySize: string;
  notes: string | null;
  decisionMakerOnCall: boolean;
  accessWithin48h: boolean;
  status: RevenueFinderStatus;
  internalNotes: string | null;
  clientId: string | null;
};

function StatusBadge({ status }: { status: RevenueFinderStatus }) {
  return (
    <span className={cn("inline-flex rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap", REVENUE_FINDER_STATUS_FILL[status])}>
      {REVENUE_FINDER_STATUS_LABEL[status]}
    </span>
  );
}

function StoreLink({ url }: { url: string }) {
  const href = safeStoreHref(url);
  if (!href) return <span className="text-muted-foreground">{url}</span>;
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      onClick={(e) => e.stopPropagation()}
      className="inline-flex max-w-[16rem] items-center gap-1 truncate text-primary hover:underline"
    >
      <span className="truncate">{url.replace(/^https?:\/\//, "")}</span>
      <ExternalLink className="h-3 w-3 shrink-0" />
    </a>
  );
}

export function RevenueFinderView({ applications }: { applications: ApplicationRow[] }) {
  const [filter, setFilter] = useState<RevenueFinderStatus | "ALL">("ALL");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const visible = filter === "ALL" ? applications : applications.filter((a) => a.status === filter);
  const selected = applications.find((a) => a.id === selectedId) ?? null;
  const count = (s: RevenueFinderStatus) => applications.filter((a) => a.status === s).length;

  return (
    <>
      <div className="flex flex-wrap gap-1.5">
        {(["ALL", ...REVENUE_FINDER_STATUSES] as const).map((s) => {
          const n = s === "ALL" ? applications.length : count(s);
          return (
            <button
              key={s}
              type="button"
              onClick={() => setFilter(s)}
              className={cn(
                "rounded-full border px-3 py-1 text-xs transition-colors",
                filter === s
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border text-muted-foreground hover:text-foreground",
              )}
            >
              {s === "ALL" ? "All" : REVENUE_FINDER_STATUS_LABEL[s]} <span className="opacity-70">{n}</span>
            </button>
          );
        })}
      </div>

      <Card>
        <CardContent className="p-0">
          {visible.length === 0 ? (
            <p className="p-8 text-center text-sm text-muted-foreground">
              {applications.length === 0
                ? "No applications yet. They appear here as soon as someone submits the Revenue Finder form."
                : "No applications with this status."}
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Status</TableHead>
                  <TableHead>Applicant</TableHead>
                  <TableHead>Store</TableHead>
                  <TableHead>Platform</TableHead>
                  <TableHead>Market</TableHead>
                  <TableHead>Monthly size</TableHead>
                  <TableHead>Applied</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {visible.map((a) => (
                  <TableRow key={a.id} className="cursor-pointer" onClick={() => setSelectedId(a.id)}>
                    <TableCell><StatusBadge status={a.status} /></TableCell>
                    <TableCell className="font-medium">{a.name}</TableCell>
                    <TableCell><StoreLink url={a.storeUrl} /></TableCell>
                    <TableCell>{a.platform}</TableCell>
                    <TableCell>{a.market}</TableCell>
                    <TableCell className="whitespace-nowrap">{a.monthlySize}</TableCell>
                    <TableCell className="whitespace-nowrap text-muted-foreground">
                      {format(a.createdAt, "d MMM yyyy")}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <ApplicationSheet
        // Remount per application so the draft status/notes reset when switching rows.
        key={selected ? `${selected.id}:${selected.status}:${selected.clientId}:${selected.internalNotes}` : "none"}
        application={selected}
        onOpenChange={(open) => !open && setSelectedId(null)}
      />
    </>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <div className="text-sm text-foreground break-words">{children}</div>
    </div>
  );
}

function ApplicationSheet({
  application,
  onOpenChange,
}: {
  application: ApplicationRow | null;
  onOpenChange: (open: boolean) => void;
}) {
  const [pending, startTransition] = useTransition();
  const [status, setStatus] = useState<RevenueFinderStatus>(application?.status ?? "NEW");
  const [notes, setNotes] = useState(application?.internalNotes ?? "");

  if (!application) return null;
  const a = application;
  const dirty = status !== a.status || notes.trim() !== (a.internalNotes ?? "");

  function save() {
    startTransition(async () => {
      const res = await updateRevenueFinderApplication({ id: a.id, status, internalNotes: notes });
      if ("error" in res && res.error) toast.error(res.error);
      else toast.success("Saved");
    });
  }

  function convert() {
    startTransition(async () => {
      const res = await convertRevenueFinderToClient(a.id);
      if ("error" in res && res.error) toast.error(res.error);
      else toast.success("Client created with the Revenue Finder service and a job for the Director");
    });
  }

  return (
    <Sheet open onOpenChange={onOpenChange}>
      <SheetContent className="flex w-full flex-col overflow-y-auto sm:max-w-md">
        <SheetHeader>
          <SheetTitle>{a.name}</SheetTitle>
        </SheetHeader>

        <div className="flex-1 space-y-5 px-4 pb-4">
          <div className="grid grid-cols-2 gap-4">
            <Field label="Role">{a.role}</Field>
            <Field label="Applied">{format(a.createdAt, "d MMM yyyy, HH:mm")}</Field>
            <Field label="Email">
              <a href={`mailto:${a.email}`} className="text-primary hover:underline">{a.email}</a>
            </Field>
            <Field label="Phone">{a.phone || "—"}</Field>
            <Field label="Platform">{a.platform}</Field>
            <Field label="Market">{a.market}</Field>
            <Field label="Monthly size">{a.monthlySize}</Field>
            <Field label="Store"><StoreLink url={a.storeUrl} /></Field>
            <Field label="Decision-maker on the call">{a.decisionMakerOnCall ? "Yes" : "No"}</Field>
            <Field label="Access within 48h">{a.accessWithin48h ? "Yes" : "No"}</Field>
          </div>

          {a.notes ? (
            <Field label="Applicant notes">
              <p className="whitespace-pre-wrap">{a.notes}</p>
            </Field>
          ) : null}

          <Separator />

          <div className="space-y-2">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Status</p>
            <Select value={status} onValueChange={(v) => setStatus(v as RevenueFinderStatus)}>
              <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
              <SelectContent>
                {REVENUE_FINDER_STATUSES.map((s) => (
                  <SelectItem key={s} value={s}>{REVENUE_FINDER_STATUS_LABEL[s]}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Internal notes</p>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              maxLength={4000}
              rows={5}
              placeholder="Only visible to the team"
            />
          </div>
        </div>

        <SheetFooter className="flex-row justify-between gap-2">
          {a.clientId ? (
            <Button variant="outline" asChild>
              <Link href={`/clients/${a.clientId}`}>View client</Link>
            </Button>
          ) : (
            <Button variant="outline" onClick={convert} disabled={pending}>
              <UserPlus className="h-4 w-4" /> Convert to client
            </Button>
          )}
          <Button onClick={save} disabled={pending || !dirty}>Save</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
