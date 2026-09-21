"use client";

import { useTransition } from "react";
import { format, isPast } from "date-fns";
import { Receipt, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/empty-state";
import { cn } from "@/lib/utils";
import { GBP_PRECISE } from "@/lib/constants";
import { InvoiceStatusCell } from "@/components/billing/status-cells";
import { updateInvoiceStatus } from "@/server/actions/invoices";
import { lineItemsTotal, type InvoiceRow } from "@/components/billing/types";

export function InvoicesTable({
  invoices,
  onRowClick,
}: {
  invoices: InvoiceRow[];
  onRowClick: (invoice: InvoiceRow) => void;
}) {
  const [pending, startTransition] = useTransition();

  if (invoices.length === 0) {
    return (
      <div className="p-4 md:p-6">
        <EmptyState icon={Receipt} title="No invoices yet" description="Invoices you create will show up here." />
      </div>
    );
  }

  return (
    <div className="overflow-x-auto p-4 md:p-6">
      <div className="overflow-hidden rounded-[var(--radius-lg)] border border-border shadow-[0_1px_2px_rgba(0,0,0,0.04),0_12px_32px_-8px_rgba(0,0,0,0.14)]">
        <Table className="[&_td]:border-r [&_td]:border-border/60 [&_td:last-child]:border-r-0 [&_th]:border-r [&_th]:border-border/60 [&_th:last-child]:border-r-0">
          <TableHeader>
            <TableRow>
              <TableHead>Invoice</TableHead>
              <TableHead>Client</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Issued</TableHead>
              <TableHead>Due</TableHead>
              <TableHead />
            </TableRow>
          </TableHeader>
          <TableBody>
            {invoices.map((inv) => {
              const overdue = inv.dueDate && isPast(inv.dueDate) && inv.status !== "PAID" && inv.status !== "VOID";
              return (
                <TableRow key={inv.id} className="cursor-pointer" onClick={() => onRowClick(inv)}>
                  <TableCell>
                    <span className="font-mono text-xs text-muted-foreground">
                      INV-{String(inv.number).padStart(4, "0")}
                    </span>
                    <p className="font-medium text-foreground">{inv.title}</p>
                  </TableCell>
                  <TableCell className="text-muted-foreground">{inv.clientName}</TableCell>
                  <TableCell className="w-36 p-0">
                    <InvoiceStatusCell invoiceId={inv.id} status={inv.status} />
                  </TableCell>
                  <TableCell className="font-mono tabular-nums text-foreground">
                    {GBP_PRECISE.format(lineItemsTotal(inv.lineItems))}
                  </TableCell>
                  <TableCell className="font-mono text-sm tabular-nums text-muted-foreground">
                    {format(inv.issueDate, "d MMM yyyy")}
                  </TableCell>
                  <TableCell
                    className={cn(
                      "font-mono text-sm tabular-nums",
                      overdue ? "text-destructive" : "text-muted-foreground",
                    )}
                  >
                    {inv.dueDate ? format(inv.dueDate, "d MMM yyyy") : "—"}
                  </TableCell>
                  <TableCell className="w-10 p-0 text-center">
                    {inv.status !== "PAID" ? (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-muted-foreground hover:text-success"
                        disabled={pending}
                        title="Mark as paid"
                        onClick={(e) => {
                          e.stopPropagation();
                          startTransition(async () => {
                            const result = await updateInvoiceStatus(inv.id, "PAID");
                            if (result?.error) toast.error(result.error);
                          });
                        }}
                      >
                        <CheckCircle2 className="h-4 w-4" />
                      </Button>
                    ) : null}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
