"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isPast,
  isSameMonth,
  isToday,
  startOfMonth,
  startOfWeek,
  subMonths,
} from "date-fns";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { INVOICE_STATUS_FILL, INVOICE_STATUS_DOT } from "@/components/billing/status-cells";
import { GBP } from "@/lib/constants";
import type { InvoiceStatus } from "@prisma/client";

export type CalendarInvoiceEntry = {
  id: string;
  clientId: string;
  clientName?: string;
  title: string;
  status: InvoiceStatus;
  dueDate: Date;
  amount?: number;
};

function ChipLabel({ entry }: { entry: CalendarInvoiceEntry }) {
  return (
    <>
      {entry.clientName ? `${entry.clientName} — ` : ""}
      {entry.title}
      {entry.amount !== undefined ? ` (${GBP.format(entry.amount)})` : ""}
    </>
  );
}

function overdue(entry: CalendarInvoiceEntry) {
  return isPast(entry.dueDate) && !isToday(entry.dueDate) && entry.status !== "PAID" && entry.status !== "VOID";
}

export function PaymentsCalendar({
  invoices,
  compact = false,
  onSelectInvoice,
}: {
  invoices: CalendarInvoiceEntry[];
  compact?: boolean;
  onSelectInvoice?: (invoiceId: string) => void;
}) {
  const [month, setMonth] = useState(() => startOfMonth(new Date()));

  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(month), { weekStartsOn: 1 });
    const end = endOfWeek(endOfMonth(month), { weekStartsOn: 1 });
    return eachDayOfInterval({ start, end });
  }, [month]);

  const entriesByDay = useMemo(() => {
    const map = new Map<string, CalendarInvoiceEntry[]>();
    for (const entry of invoices) {
      const key = format(entry.dueDate, "yyyy-MM-dd");
      const list = map.get(key) ?? [];
      list.push(entry);
      map.set(key, list);
    }
    return map;
  }, [invoices]);

  const maxChips = compact ? 2 : 3;

  function renderChip(entry: CalendarInvoiceEntry) {
    const chipClass = cn(
      "block w-full truncate rounded-[var(--radius-sm)] px-1.5 py-0.5 text-left text-[10px] font-medium",
      INVOICE_STATUS_FILL[entry.status],
      overdue(entry) && "ring-1 ring-destructive",
    );
    if (onSelectInvoice) {
      return (
        <button
          key={entry.id}
          type="button"
          className={chipClass}
          title={`${entry.title}${entry.clientName ? ` — ${entry.clientName}` : ""}`}
          onClick={() => onSelectInvoice(entry.id)}
        >
          <ChipLabel entry={entry} />
        </button>
      );
    }
    return (
      <Link
        key={entry.id}
        href={`/clients/${entry.clientId}/billing`}
        className={chipClass}
        title={`${entry.title}${entry.clientName ? ` — ${entry.clientName}` : ""}`}
      >
        <ChipLabel entry={entry} />
      </Link>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-foreground">{format(month, "MMMM yyyy")}</p>
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="sm" onClick={() => setMonth(new Date())} className="h-7 px-2 text-xs">
            Today
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => setMonth((m) => subMonths(m, 1))}
            aria-label="Previous month"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => setMonth((m) => addMonths(m, 1))}
            aria-label="Next month"
          >
            <ChevronRight className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>

      <div className="overflow-hidden rounded-[var(--radius-lg)] border border-border">
        <div className="grid grid-cols-7 border-b border-border bg-muted/30">
          {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
            <div key={d} className="px-1.5 py-1.5 text-center text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
              {d}
            </div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {days.map((day) => {
            const key = format(day, "yyyy-MM-dd");
            const entries = entriesByDay.get(key) ?? [];
            const visible = entries.slice(0, maxChips);
            const overflowCount = entries.length - visible.length;
            const inMonth = isSameMonth(day, month);

            return (
              <div
                key={key}
                className={cn(
                  "min-h-[72px] border-b border-r border-border p-1 last:border-r-0",
                  compact && "min-h-[52px]",
                  !inMonth && "bg-muted/10",
                )}
              >
                <span
                  className={cn(
                    "mb-0.5 inline-flex h-5 w-5 items-center justify-center rounded-full text-[11px] tabular-nums",
                    !inMonth && "text-muted-foreground/50",
                    isToday(day) && "bg-primary text-primary-foreground font-semibold",
                    !isToday(day) && inMonth && "text-foreground",
                  )}
                >
                  {format(day, "d")}
                </span>
                <div className="space-y-0.5">
                  {visible.map(renderChip)}
                  {overflowCount > 0 ? (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <button
                          type="button"
                          className="block w-full truncate rounded-[var(--radius-sm)] px-1.5 py-0.5 text-left text-[10px] font-medium text-muted-foreground hover:bg-accent/60"
                        >
                          +{overflowCount} more
                        </button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="start" className="w-56">
                        {entries.map((entry) => (
                          <DropdownMenuItem
                            key={entry.id}
                            onSelect={() => {
                              if (onSelectInvoice) onSelectInvoice(entry.id);
                            }}
                            asChild={!onSelectInvoice}
                          >
                            {onSelectInvoice ? (
                              <span className="flex items-center gap-1.5 truncate">
                                <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", INVOICE_STATUS_DOT[entry.status])} />
                                <span className="truncate">
                                  <ChipLabel entry={entry} />
                                </span>
                              </span>
                            ) : (
                              <Link href={`/clients/${entry.clientId}/billing`} className="flex items-center gap-1.5 truncate">
                                <span className={cn("h-1.5 w-1.5 shrink-0 rounded-full", INVOICE_STATUS_DOT[entry.status])} />
                                <span className="truncate">
                                  <ChipLabel entry={entry} />
                                </span>
                              </Link>
                            )}
                          </DropdownMenuItem>
                        ))}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
