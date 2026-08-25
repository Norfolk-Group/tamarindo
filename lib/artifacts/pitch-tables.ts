import type { DeckTable } from "@/lib/artifacts/deck";
import type { CashflowModel, StatementLine } from "@/lib/model/types";

const PNL_YEARS = 5;

export function formatUsd(value: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}

export function formatPct(share: number): string {
  return `${(share * 100).toFixed(0)}%`;
}

function fyHeaders(model: CashflowModel, count = PNL_YEARS): string[] {
  return model.fyLabels.slice(0, count).map((_, i) => `FY${i + 1}`);
}

function cells(line: StatementLine | undefined, count: number): string[] {
  return Array.from({ length: count }, (_, i) => formatUsd(line?.values[i] ?? 0));
}

function sumSection(
  lines: StatementLine[],
  section: StatementLine["section"],
  yearIndex: number,
): number {
  return lines
    .filter((line) => line.section === section)
    .reduce((sum, line) => sum + (line.values[yearIndex] ?? 0), 0);
}

/** OpCo P&L shell — US operating lines, live from the cash-flow engine. */
export function plTable(model: CashflowModel): DeckTable {
  const us = model.us;
  const count = Math.min(PNL_YEARS, model.fyCount);
  const inLines = us.lines.filter((line) => line.section === "operatingIn");
  const outLines = us.lines.filter((line) => line.section === "operatingOut");
  const rows: string[][] = [
    ...inLines.map((line) => [line.label, ...cells(line, count)]),
    [
      "Operating receipts",
      ...Array.from({ length: count }, (_, i) => formatUsd(sumSection(us.lines, "operatingIn", i))),
    ],
    ...outLines
      .filter((line) => line.values.slice(0, count).some((value) => value !== 0))
      .map((line) => [line.label, ...cells(line, count)]),
    [
      "Operating payments",
      ...Array.from({ length: count }, (_, i) => formatUsd(sumSection(us.lines, "operatingOut", i))),
    ],
    [
      "Cash from operations",
      ...us.years.slice(0, count).map((year) => formatUsd(year.cfoUsd)),
    ],
    [
      "Closing cash",
      ...us.years.slice(0, count).map((year) => formatUsd(year.closingCashUsd)),
    ],
  ];
  return {
    caption: "Tamarindo US (OpCo) — live model",
    headers: ["Line", ...fyHeaders(model, count)],
    rows,
    footnote:
      "FACT — runCashflowModel at request time. Vehicle warehouse and Intervest line are not on this slide.",
  };
}

/** How OpCo equity is spent in FY1. Not vehicle asset purchases. */
export function useOfFundsTable(model: CashflowModel): DeckTable {
  const fy0 = 0;
  const uses = model.us.lines
    .filter((line) => line.section === "operatingOut")
    .map((line) => ({ label: line.label, amount: line.values[fy0] ?? 0 }))
    .filter((row) => row.amount !== 0);
  const total = uses.reduce((sum, row) => sum + row.amount, 0);
  const equity = model.us.lines.find((line) => line.id === "seed")?.values[fy0] ?? 0;
  const rows: string[][] = [
    ...uses.map((row) => [
      row.label,
      formatUsd(row.amount),
      total ? formatPct(row.amount / total) : "—",
    ]),
    ["Total OpCo uses (FY1)", formatUsd(total), total ? "100%" : "—"],
    ["Equity proceeds in FY1 (model)", formatUsd(equity), "source"],
  ];
  return {
    caption: "Use of OpCo funds — FY1",
    headers: ["Use", "FY1", "Share"],
    rows,
    footnote:
      "OPINION until Deal Terms publish the raise. Vehicles buy properties; this table is payroll, desks, legal, tech, and the Colombia mandate.",
  };
}
