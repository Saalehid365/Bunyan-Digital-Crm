"use client";

import { useTransition } from "react";
import { format } from "date-fns";
import { Download, Trash2 } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { GBP_PRECISE } from "@/lib/constants";
import { deleteInvoice } from "@/server/actions/invoices";
import { InvoiceStatusCell } from "@/components/billing/status-cells";
import { lineItemsTotal, type InvoiceRow } from "@/components/billing/types";

export function InvoiceDetailSheet({
  invoice,
  open,
  onOpenChange,
}: {
  invoice: InvoiceRow | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [pending, startTransition] = useTransition();

  if (!invoice) return null;
  const total = lineItemsTotal(invoice.lineItems);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex w-full flex-col overflow-y-auto sm:max-w-md">
        <SheetHeader>
          <SheetTitle>
            Invoice INV-{String(invoice.number).padStart(4, "0")}
          </SheetTitle>
        </SheetHeader>

        <div className="flex-1 space-y-6 px-4 pb-4">
          <div className="space-y-1">
            <p className="text-sm font-medium text-foreground">{invoice.title}</p>
            <p className="text-sm text-muted-foreground">{invoice.clientName}</p>
          </div>

          <div className="flex items-center gap-3">
            <InvoiceStatusCell invoiceId={invoice.id} status={invoice.status} className="w-auto px-3" />
            {invoice.quoteNumber ? (
              <span className="text-xs text-muted-foreground">
                From quote Q-{String(invoice.quoteNumber).padStart(4, "0")}
              </span>
            ) : null}
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-xs text-muted-foreground">Issued</p>
              <p className="text-foreground">{format(invoice.issueDate, "d MMM yyyy")}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Due</p>
              <p className="text-foreground">
                {invoice.dueDate ? format(invoice.dueDate, "d MMM yyyy") : "—"}
              </p>
            </div>
          </div>

          {invoice.paidAt ? (
            <p className="text-sm text-success">Paid {format(invoice.paidAt, "d MMM yyyy")}</p>
          ) : null}

          <Separator />

          <div className="space-y-2">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Line items
            </p>
            <div className="rounded-[var(--radius-md)] border border-border divide-y divide-border">
              {invoice.lineItems.map((item) => (
                <div key={item.id} className="flex items-center justify-between px-3 py-2 text-sm">
                  <span className="text-foreground">
                    {item.description}
                    <span className="ml-1.5 text-xs text-muted-foreground">
                      {item.quantity} × {GBP_PRECISE.format(item.unitPrice)}
                    </span>
                  </span>
                  <span className="font-mono tabular-nums text-foreground">
                    {GBP_PRECISE.format(item.quantity * item.unitPrice)}
                  </span>
                </div>
              ))}
              <div className="flex items-center justify-between px-3 py-2 text-sm font-semibold">
                <span>Total</span>
                <span className="font-mono tabular-nums">{GBP_PRECISE.format(total)}</span>
              </div>
            </div>
          </div>

          {invoice.notes ? (
            <div className="space-y-1">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Notes</p>
              <p className="text-sm text-foreground whitespace-pre-wrap">{invoice.notes}</p>
            </div>
          ) : null}
        </div>

        <SheetFooter className="flex-row flex-wrap gap-2">
          <Button variant="outline" size="sm" asChild>
            <a href={`/api/invoices/${invoice.id}/pdf`} target="_blank" rel="noreferrer">
              <Download className="h-3.5 w-3.5" /> PDF
            </a>
          </Button>
          <Button
            variant="destructive"
            size="sm"
            disabled={pending}
            onClick={() =>
              startTransition(async () => {
                await deleteInvoice(invoice.id, invoice.clientId);
                onOpenChange(false);
              })
            }
          >
            <Trash2 className="h-3.5 w-3.5" /> Delete
          </Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
