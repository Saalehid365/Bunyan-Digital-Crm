import { StyleSheet } from "@react-pdf/renderer";

/** Shared styles for the Quote/Invoice PDFs — plain, legible, on-brand without
 * depending on the app's CSS custom properties (PDF rendering is a separate engine). */
export const pdfStyles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 10,
    fontFamily: "Helvetica",
    color: "#1a1a1a",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 32,
  },
  brand: {
    fontSize: 16,
    fontWeight: 700,
  },
  brandSub: {
    fontSize: 9,
    color: "#6f6f6f",
    marginTop: 2,
  },
  docTitle: {
    fontSize: 20,
    fontWeight: 700,
    textAlign: "right",
  },
  docNumber: {
    fontSize: 10,
    color: "#6f6f6f",
    textAlign: "right",
    marginTop: 2,
  },
  metaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  metaBlock: {
    flexDirection: "column",
  },
  metaLabel: {
    fontSize: 8,
    color: "#6f6f6f",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  metaValue: {
    fontSize: 10,
  },
  table: {
    marginTop: 8,
    borderTop: "1pt solid #e2e2e2",
  },
  tableRowHeader: {
    flexDirection: "row",
    borderBottom: "1pt solid #e2e2e2",
    paddingVertical: 6,
  },
  tableRow: {
    flexDirection: "row",
    borderBottom: "1pt solid #f0f0f0",
    paddingVertical: 6,
  },
  colDescription: { flex: 1 },
  colQty: { width: 50, textAlign: "right" },
  colPrice: { width: 80, textAlign: "right" },
  colAmount: { width: 80, textAlign: "right" },
  headerCell: {
    fontSize: 8,
    color: "#6f6f6f",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginTop: 12,
    paddingTop: 8,
    borderTop: "1pt solid #1a1a1a",
  },
  totalLabel: {
    fontSize: 11,
    fontWeight: 700,
    marginRight: 16,
  },
  totalValue: {
    fontSize: 11,
    fontWeight: 700,
  },
  notes: {
    marginTop: 32,
  },
  notesLabel: {
    fontSize: 8,
    color: "#6f6f6f",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  notesBody: {
    fontSize: 9,
    lineHeight: 1.5,
  },
  statusBadge: {
    fontSize: 9,
    marginTop: 6,
    textAlign: "right",
    color: "#6f6f6f",
  },
});
