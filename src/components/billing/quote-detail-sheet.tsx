"use client";

import { useTransition } from "react";
import { format } from "date-fns";
import { Download, Trash2, ArrowRightLeft } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { GBP_PRECISE } from "@/lib/constants";
import { deleteQuote, convertQuoteToInvoice } from "@/server/actions/quotes";
import { QuoteStatusCell } from "@/components/billing/status-cells";
import { lineItemsTotal, type QuoteRow } from "@/components/billing/types";

export function QuoteDetailSheet({
  quote,
  open,
  onOpenChange,
  onConverted,
}: {
  quote: QuoteRow | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConverted: (invoiceId: string) => void;
}) {
  const [pending, startTransition] = useTransition();

  if (!quote) return null;
  const total = lineItemsTotal(quote.lineItems);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="flex w-full flex-col overflow-y-auto sm:max-w-md">
        <SheetHeader>
          <SheetTitle>
            Quote Q-{String(quote.number).padStart(4, "0")}
          </SheetTitle>
        </SheetHeader>

        <div className="flex-1 space-y-6 px-4 pb-4">
          <div className="space-y-1">
            <p className="text-sm font-medium text-foreground">{quote.title}</p>
            <p className="text-sm text-muted-foreground">{quote.clientName}</p>
          </div>

          <div className="flex items-center gap-3">
            <QuoteStatusCell quoteId={quote.id} status={quote.status} className="w-auto px-3" />
            {quote.hasInvoice ? (
              <span className="text-xs text-muted-foreground">Converted to invoice</span>
            ) : null}
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-xs text-muted-foreground">Issued</p>
              <p className="text-foreground">{format(quote.issueDate, "d MMM yyyy")}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Expires</p>
              <p className="text-foreground">
                {quote.expiryDate ? format(quote.expiryDate, "d MMM yyyy") : "—"}
              </p>
            </div>
          </div>

          <Separator />

          <div className="space-y-2">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Line items
            </p>
            <div className="rounded-[var(--radius-md)] border border-border divide-y divide-border">
              {quote.lineItems.map((item) => (
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

          {quote.notes ? (
            <div className="space-y-1">
              <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">Notes</p>
              <p className="text-sm text-foreground whitespace-pre-wrap">{quote.notes}</p>
            </div>
          ) : null}
        </div>

        <SheetFooter className="flex-row flex-wrap gap-2">
          <Button variant="outline" size="sm" asChild>
            <a href={`/api/quotes/${quote.id}/pdf`} target="_blank" rel="noreferrer">
              <Download className="h-3.5 w-3.5" /> PDF
            </a>
          </Button>
          {!quote.hasInvoice ? (
            <Button
              variant="outline"
              size="sm"
              disabled={pending}
              onClick={() =>
                startTransition(async () => {
                  const result = await convertQuoteToInvoice(quote.id);
                  if (result?.id) onConverted(result.id);
                })
              }
            >
              <ArrowRightLeft className="h-3.5 w-3.5" /> Convert to invoice
            </Button>
          ) : null}
          <Button
            variant="destructive"
            size="sm"
            disabled={pending}
            onClick={() =>
              startTransition(async () => {
                await deleteQuote(quote.id, quote.clientId);
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
