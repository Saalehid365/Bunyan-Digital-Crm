"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { QuotesTable } from "@/components/billing/quotes-table";
import { InvoicesTable } from "@/components/billing/invoices-table";
import { QuoteFormDialog } from "@/components/billing/quote-form-dialog";
import { InvoiceFormDialog } from "@/components/billing/invoice-form-dialog";
import { QuoteDetailSheet } from "@/components/billing/quote-detail-sheet";
import { InvoiceDetailSheet } from "@/components/billing/invoice-detail-sheet";
import type { QuoteRow, InvoiceRow } from "@/components/billing/types";

type ClientOption = { id: string; name: string };
type ClientServiceOption = { id: string; name: string };

export function QuotesInvoicesView({
  quotes,
  invoices,
  clients,
  clientServicesByClient,
}: {
  quotes: QuoteRow[];
  invoices: InvoiceRow[];
  clients: ClientOption[];
  clientServicesByClient: Record<string, ClientServiceOption[]>;
}) {
  const [tab, setTab] = useState<"quotes" | "invoices">("quotes");
  const [quoteDialogOpen, setQuoteDialogOpen] = useState(false);
  const [invoiceDialogOpen, setInvoiceDialogOpen] = useState(false);
  const [selectedQuoteId, setSelectedQuoteId] = useState<string | null>(null);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(null);

  const selectedQuote = quotes.find((q) => q.id === selectedQuoteId) ?? null;
  const selectedInvoice = invoices.find((i) => i.id === selectedInvoiceId) ?? null;

  return (
    <div className="flex flex-1 flex-col">
      <div className="flex items-center gap-5 border-b border-border px-4 md:px-6">
        {(["quotes", "invoices"] as const).map((key) => (
          <button
            key={key}
            onClick={() => setTab(key)}
            className={cn(
              "relative py-3 text-sm capitalize transition-colors",
              tab === key ? "font-medium text-foreground" : "text-muted-foreground hover:text-foreground",
            )}
          >
            {key === "quotes" ? `Quotes (${quotes.length})` : `Invoices (${invoices.length})`}
            {tab === key ? <span className="absolute inset-x-0 -bottom-px h-[2px] bg-primary" /> : null}
          </button>
        ))}
      </div>

      <div className="flex items-center justify-end gap-2 border-b border-border px-4 py-2.5 md:px-6">
        {tab === "quotes" ? (
          <Button size="sm" onClick={() => setQuoteDialogOpen(true)} disabled={clients.length === 0}>
            <Plus className="h-3.5 w-3.5" /> New quote
          </Button>
        ) : (
          <Button size="sm" onClick={() => setInvoiceDialogOpen(true)} disabled={clients.length === 0}>
            <Plus className="h-3.5 w-3.5" /> New invoice
          </Button>
        )}
      </div>

      {tab === "quotes" ? (
        <QuotesTable quotes={quotes} onRowClick={(q) => setSelectedQuoteId(q.id)} />
      ) : (
        <InvoicesTable invoices={invoices} onRowClick={(i) => setSelectedInvoiceId(i.id)} />
      )}

      <QuoteFormDialog
        open={quoteDialogOpen}
        onOpenChange={setQuoteDialogOpen}
        clients={clients}
        clientServicesByClient={clientServicesByClient}
        onDone={() => setQuoteDialogOpen(false)}
      />
      <InvoiceFormDialog
        open={invoiceDialogOpen}
        onOpenChange={setInvoiceDialogOpen}
        clients={clients}
        clientServicesByClient={clientServicesByClient}
        onDone={() => setInvoiceDialogOpen(false)}
      />

      <QuoteDetailSheet
        quote={selectedQuote}
        open={Boolean(selectedQuote)}
        onOpenChange={(open) => !open && setSelectedQuoteId(null)}
        onConverted={() => {
          setSelectedQuoteId(null);
          setTab("invoices");
        }}
      />
      <InvoiceDetailSheet
        invoice={selectedInvoice}
        open={Boolean(selectedInvoice)}
        onOpenChange={(open) => !open && setSelectedInvoiceId(null)}
      />
    </div>
  );
}
