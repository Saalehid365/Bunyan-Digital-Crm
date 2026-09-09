"use client";

import { format } from "date-fns";
import { FileText } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { EmptyState } from "@/components/empty-state";
import { GBP_PRECISE } from "@/lib/constants";
import { QuoteStatusCell } from "@/components/billing/status-cells";
import { lineItemsTotal, type QuoteRow } from "@/components/billing/types";

export function QuotesTable({ quotes, onRowClick }: { quotes: QuoteRow[]; onRowClick: (quote: QuoteRow) => void }) {
  if (quotes.length === 0) {
    return (
      <div className="p-4 md:p-6">
        <EmptyState icon={FileText} title="No quotes yet" description="Quotes you create will show up here." />
      </div>
    );
  }

  return (
    <div className="overflow-x-auto p-4 md:p-6">
      <div className="overflow-hidden rounded-[var(--radius-lg)] border border-border shadow-[0_1px_2px_rgba(0,0,0,0.04),0_12px_32px_-8px_rgba(0,0,0,0.14)]">
        <Table className="[&_td]:border-r [&_td]:border-border/60 [&_td:last-child]:border-r-0 [&_th]:border-r [&_th]:border-border/60 [&_th:last-child]:border-r-0">
          <TableHeader>
            <TableRow>
              <TableHead>Quote</TableHead>
              <TableHead>Client</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Issued</TableHead>
              <TableHead>Expires</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {quotes.map((q) => (
              <TableRow key={q.id} className="cursor-pointer" onClick={() => onRowClick(q)}>
                <TableCell>
                  <span className="font-mono text-xs text-muted-foreground">
                    Q-{String(q.number).padStart(4, "0")}
                  </span>
                  <p className="font-medium text-foreground">{q.title}</p>
                </TableCell>
                <TableCell className="text-muted-foreground">{q.clientName}</TableCell>
                <TableCell className="w-36 p-0">
                  <QuoteStatusCell quoteId={q.id} status={q.status} />
                </TableCell>
                <TableCell className="font-mono tabular-nums text-foreground">
                  {GBP_PRECISE.format(lineItemsTotal(q.lineItems))}
                </TableCell>
                <TableCell className="font-mono text-sm tabular-nums text-muted-foreground">
                  {format(q.issueDate, "d MMM yyyy")}
                </TableCell>
                <TableCell className="font-mono text-sm tabular-nums text-muted-foreground">
                  {q.expiryDate ? format(q.expiryDate, "d MMM yyyy") : "—"}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
