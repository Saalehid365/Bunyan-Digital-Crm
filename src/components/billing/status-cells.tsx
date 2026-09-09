"use client";

import { useTransition } from "react";
import { Check, ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { QUOTE_STATUSES, QUOTE_STATUS_LABEL, INVOICE_STATUSES, INVOICE_STATUS_LABEL } from "@/lib/constants";
import { updateQuoteStatus } from "@/server/actions/quotes";
import { updateInvoiceStatus } from "@/server/actions/invoices";
import type { QuoteStatus, InvoiceStatus } from "@prisma/client";

export const QUOTE_STATUS_FILL: Record<QuoteStatus, string> = {
  DRAFT: "bg-muted text-muted-foreground",
  SENT: "bg-[var(--chart-2)]/15 text-[var(--chart-2)]",
  ACCEPTED: "bg-success/15 text-success",
  DECLINED: "bg-destructive/15 text-destructive",
  EXPIRED: "bg-muted text-muted-foreground/70",
};

export const QUOTE_STATUS_DOT: Record<QuoteStatus, string> = {
  DRAFT: "bg-muted-foreground/50",
  SENT: "bg-[var(--chart-2)]",
  ACCEPTED: "bg-success",
  DECLINED: "bg-destructive",
  EXPIRED: "bg-muted-foreground/30",
};

export const INVOICE_STATUS_FILL: Record<InvoiceStatus, string> = {
  DRAFT: "bg-muted text-muted-foreground",
  SENT: "bg-[var(--chart-2)]/15 text-[var(--chart-2)]",
  PAID: "bg-success/15 text-success",
  OVERDUE: "bg-destructive/15 text-destructive",
  VOID: "bg-muted text-muted-foreground/70",
};

export const INVOICE_STATUS_DOT: Record<InvoiceStatus, string> = {
  DRAFT: "bg-muted-foreground/50",
  SENT: "bg-[var(--chart-2)]",
  PAID: "bg-success",
  OVERDUE: "bg-destructive",
  VOID: "bg-muted-foreground/30",
};

export function QuoteStatusCell({
  quoteId,
  status,
  className,
}: {
  quoteId: string;
  status: QuoteStatus;
  className?: string;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        disabled={pending}
        onClick={(e) => e.stopPropagation()}
        className={cn(
          "flex h-full min-h-9 w-full items-center justify-center gap-1 rounded-[var(--radius-sm)] text-xs font-semibold transition-opacity duration-150 hover:opacity-85 disabled:opacity-60",
          QUOTE_STATUS_FILL[status],
          className,
        )}
      >
        {QUOTE_STATUS_LABEL[status]}
        <ChevronDown className="h-3 w-3 opacity-70" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="center" className="w-40">
        {QUOTE_STATUSES.map((s) => (
          <DropdownMenuItem
            key={s.value}
            onClick={(e) => {
              e.stopPropagation();
              startTransition(() => {
                updateQuoteStatus(quoteId, s.value);
              });
            }}
          >
            <span className={cn("h-2 w-2 rounded-full", QUOTE_STATUS_DOT[s.value])} />
            {s.label}
            {s.value === status ? <Check className="ml-auto h-3.5 w-3.5" /> : null}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function InvoiceStatusCell({
  invoiceId,
  status,
  className,
}: {
  invoiceId: string;
  status: InvoiceStatus;
  className?: string;
}) {
  const [pending, startTransition] = useTransition();

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        disabled={pending}
        onClick={(e) => e.stopPropagation()}
        className={cn(
          "flex h-full min-h-9 w-full items-center justify-center gap-1 rounded-[var(--radius-sm)] text-xs font-semibold transition-opacity duration-150 hover:opacity-85 disabled:opacity-60",
          INVOICE_STATUS_FILL[status],
          className,
        )}
      >
        {INVOICE_STATUS_LABEL[status]}
        <ChevronDown className="h-3 w-3 opacity-70" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="center" className="w-40">
        {INVOICE_STATUSES.map((s) => (
          <DropdownMenuItem
            key={s.value}
            onClick={(e) => {
              e.stopPropagation();
              startTransition(() => {
                updateInvoiceStatus(invoiceId, s.value);
              });
            }}
          >
            <span className={cn("h-2 w-2 rounded-full", INVOICE_STATUS_DOT[s.value])} />
            {s.label}
            {s.value === status ? <Check className="ml-auto h-3.5 w-3.5" /> : null}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
