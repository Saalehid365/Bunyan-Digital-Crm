"use client";

import { useId, useState } from "react";
import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { GBP_PRECISE } from "@/lib/constants";

type ClientServiceOption = { id: string; name: string };

type Row = {
  key: string;
  clientServiceId: string;
  description: string;
  quantity: string;
  unitPrice: string;
};

function emptyRow(): Row {
  return {
    key: Math.random().toString(36).slice(2),
    clientServiceId: "none",
    description: "",
    quantity: "1",
    unitPrice: "",
  };
}

export function LineItemsEditor({
  clientServices,
  fieldName = "lineItemsJson",
}: {
  clientServices: ClientServiceOption[];
  fieldName?: string;
}) {
  const [rows, setRows] = useState<Row[]>([emptyRow()]);
  const idBase = useId();

  const json = JSON.stringify(
    rows.map((r) => ({
      clientServiceId: r.clientServiceId === "none" ? "" : r.clientServiceId,
      description: r.description,
      quantity: r.quantity,
      unitPrice: r.unitPrice,
    })),
  );

  const total = rows.reduce((sum, r) => {
    const qty = Number(r.quantity) || 0;
    const price = Number(r.unitPrice) || 0;
    return sum + qty * price;
  }, 0);

  function updateRow(key: string, patch: Partial<Row>) {
    setRows((prev) => prev.map((r) => (r.key === key ? { ...r, ...patch } : r)));
  }

  function removeRow(key: string) {
    setRows((prev) => (prev.length > 1 ? prev.filter((r) => r.key !== key) : prev));
  }

  return (
    <div className="space-y-2">
      <Label>Line items</Label>
      <input type="hidden" name={fieldName} value={json} />
      <div className="rounded-[var(--radius-md)] border border-border">
        <div className="hidden grid-cols-[1fr_5rem_6rem_2rem] gap-2 border-b border-border px-3 py-2 text-xs font-medium text-muted-foreground sm:grid">
          <span>Description</span>
          <span>Qty</span>
          <span>Unit price (£)</span>
          <span />
        </div>
        <div className="divide-y divide-border">
          {rows.map((row) => (
            <div
              key={row.key}
              className="grid grid-cols-1 gap-2 p-3 sm:grid-cols-[1fr_5rem_6rem_2rem] sm:items-center"
            >
              <div className="space-y-1.5">
                <Input
                  aria-label="Description"
                  placeholder="e.g. eBay listing optimisation"
                  value={row.description}
                  onChange={(e) => updateRow(row.key, { description: e.target.value })}
                />
                {clientServices.length > 0 ? (
                  <Select
                    value={row.clientServiceId}
                    onValueChange={(v) => updateRow(row.key, { clientServiceId: v })}
                  >
                    <SelectTrigger className="h-7 w-full text-xs" aria-label="Linked service">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">No linked service</SelectItem>
                      {clientServices.map((s) => (
                        <SelectItem key={s.id} value={s.id}>
                          {s.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : null}
              </div>
              <Input
                aria-label="Quantity"
                type="number"
                min="0"
                step="1"
                value={row.quantity}
                onChange={(e) => updateRow(row.key, { quantity: e.target.value })}
              />
              <Input
                aria-label="Unit price"
                type="number"
                min="0"
                step="0.01"
                value={row.unitPrice}
                onChange={(e) => updateRow(row.key, { unitPrice: e.target.value })}
              />
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                onClick={() => removeRow(row.key)}
                disabled={rows.length === 1}
                aria-label="Remove line"
              >
                <X className="h-3.5 w-3.5" />
              </Button>
            </div>
          ))}
        </div>
        <div className="flex items-center justify-between border-t border-border px-3 py-2">
          <Button type="button" variant="ghost" size="sm" onClick={() => setRows((p) => [...p, emptyRow()])}>
            <Plus className="h-3.5 w-3.5" /> Add line
          </Button>
          <span className="font-mono text-sm font-semibold tabular-nums text-foreground">
            Total: {GBP_PRECISE.format(total)}
          </span>
        </div>
      </div>
      <p id={`${idBase}-hint`} className="sr-only">
        Add one or more line items with a description, quantity, and unit price.
      </p>
    </div>
  );
}
