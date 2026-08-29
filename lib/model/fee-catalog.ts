/**
 * Complete Tamarindo Credit LLC fee book. Every industry-standard line
 * Credit is paid, and every line Credit pays, lives here — even at $0.
 * Blue levers. Do not call a referring-partner cost a broker fee.
 */

export type FeeSide = "in" | "out";

export type FeeLine = {
  id: string;
  label: string;
  side: FeeSide;
};

/** Statement / engine bag keys. Order is the P&L order. */
export const FEE_LINES: FeeLine[] = [
  { id: "application", label: "Application fee (client)", side: "in" },
  { id: "document", label: "Document / admin fee at close (client)", side: "in" },
  { id: "creditReport", label: "Credit-report recovery (client)", side: "in" },
  { id: "titleStudy", label: "Title-study fee (client)", side: "in" },
  { id: "wireIn", label: "Wire / ACH fee (client)", side: "in" },
  { id: "late", label: "Late fees", side: "in" },
  { id: "nsf", label: "NSF / returned-payment fees", side: "in" },
  { id: "statement", label: "Statement fees", side: "in" },
  { id: "modification", label: "Modification fees", side: "in" },
  { id: "assumption", label: "Assumption / transfer fees", side: "in" },
  { id: "extension", label: "Extension fees", side: "in" },
  { id: "payoffQuote", label: "Payoff-quote fees", side: "in" },
  { id: "purchaseOption", label: "Purchase-option processing fees", side: "in" },
  { id: "disposition", label: "End-of-term disposition fees", side: "in" },
  { id: "prepay", label: "Early-payoff protection", side: "in" },
  { id: "default", label: "Default / workout fees", side: "in" },
  { id: "collection", label: "Collection / recovery fees", side: "in" },
  { id: "minServicing", label: "Minimum servicing (top-up)", side: "in" },
  { id: "forcedPlace", label: "Forced-place insurance markup", side: "in" },
  { id: "unusedLine", label: "Unused-line / commitment fee (to warehouse)", side: "out" },
  { id: "fxHedge", label: "FX hedge cost", side: "out" },
  { id: "referring", label: "Referring-partner cost", side: "out" },
  { id: "bureauKyc", label: "Bureau / KYC cost", side: "out" },
  { id: "backupServicer", label: "Backup-servicer cost", side: "out" },
  { id: "subservicer", label: "Subservicer / tech cost", side: "out" },
  { id: "uccFiling", label: "UCC / filing cost", side: "out" },
  { id: "wireOut", label: "Outbound wire cost", side: "out" },
  { id: "notaryRegistro", label: "Notary / registro cost", side: "out" },
];

export const FEE_IN_IDS = FEE_LINES.filter((row) => row.side === "in").map((row) => row.id);
export const FEE_OUT_IDS = FEE_LINES.filter((row) => row.side === "out").map((row) => row.id);

export function feeLabel(id: string): string {
  return FEE_LINES.find((row) => row.id === id)?.label ?? id;
}

export function sumFeeBag(bag: Record<string, number>): number {
  return Object.values(bag).reduce((sum, value) => sum + value, 0);
}
