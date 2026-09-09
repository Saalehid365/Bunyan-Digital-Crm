import { Document, Page, Text, View } from "@react-pdf/renderer";
import { pdfStyles as s } from "./styles";
import { GBP_PRECISE, QUOTE_STATUS_LABEL } from "@/lib/constants";
import type { QuoteStatus } from "@prisma/client";

export type QuotePdfData = {
  number: number;
  title: string;
  status: QuoteStatus;
  clientName: string;
  companyName: string | null;
  issueDate: Date;
  expiryDate: Date | null;
  notes: string | null;
  lineItems: { description: string; quantity: number; unitPrice: number }[];
};

function formatDate(d: Date) {
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export function QuoteDocument({ data }: { data: QuotePdfData }) {
  const total = data.lineItems.reduce((sum, i) => sum + i.quantity * i.unitPrice, 0);

  return (
    <Document>
      <Page size="A4" style={s.page}>
        <View style={s.header}>
          <View>
            <Text style={s.brand}>Bunyan Digital</Text>
            <Text style={s.brandSub}>Client & operations CRM</Text>
          </View>
          <View>
            <Text style={s.docTitle}>Quote</Text>
            <Text style={s.docNumber}>Q-{String(data.number).padStart(4, "0")}</Text>
            <Text style={s.statusBadge}>{QUOTE_STATUS_LABEL[data.status]}</Text>
          </View>
        </View>

        <View style={s.metaRow}>
          <View style={s.metaBlock}>
            <Text style={s.metaLabel}>Prepared for</Text>
            <Text style={s.metaValue}>{data.clientName}</Text>
            {data.companyName ? <Text style={s.metaValue}>{data.companyName}</Text> : null}
          </View>
          <View style={s.metaBlock}>
            <Text style={s.metaLabel}>Issued</Text>
            <Text style={s.metaValue}>{formatDate(data.issueDate)}</Text>
          </View>
          <View style={s.metaBlock}>
            <Text style={s.metaLabel}>Expires</Text>
            <Text style={s.metaValue}>{data.expiryDate ? formatDate(data.expiryDate) : "—"}</Text>
          </View>
        </View>

        <Text style={{ fontSize: 12, fontWeight: 700, marginBottom: 4 }}>{data.title}</Text>

        <View style={s.table}>
          <View style={s.tableRowHeader}>
            <Text style={[s.colDescription, s.headerCell]}>Description</Text>
            <Text style={[s.colQty, s.headerCell]}>Qty</Text>
            <Text style={[s.colPrice, s.headerCell]}>Unit price</Text>
            <Text style={[s.colAmount, s.headerCell]}>Amount</Text>
          </View>
          {data.lineItems.map((item, i) => (
            <View style={s.tableRow} key={i}>
              <Text style={s.colDescription}>{item.description}</Text>
              <Text style={s.colQty}>{item.quantity}</Text>
              <Text style={s.colPrice}>{GBP_PRECISE.format(item.unitPrice)}</Text>
              <Text style={s.colAmount}>{GBP_PRECISE.format(item.quantity * item.unitPrice)}</Text>
            </View>
          ))}
        </View>

        <View style={s.totalRow}>
          <Text style={s.totalLabel}>Total</Text>
          <Text style={s.totalValue}>{GBP_PRECISE.format(total)}</Text>
        </View>

        {data.notes ? (
          <View style={s.notes}>
            <Text style={s.notesLabel}>Notes</Text>
            <Text style={s.notesBody}>{data.notes}</Text>
          </View>
        ) : null}
      </Page>
    </Document>
  );
}
