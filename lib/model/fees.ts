import { FEE_IN_IDS, FEE_OUT_IDS } from "@/lib/model/fee-catalog";
import { cents, d } from "@/lib/model/money";
import type { MonthAcc } from "@/lib/model/engine-acc";
import { num, type VariableValue } from "@/lib/model/variables";

export type FeeEvents = {
  newContracts: number;
  fundedNew: number;
  active: number;
  fundedAum: number;
  committedLine: number;
  balloons: number;
  servicingUsd: number;
};

function add(
  bag: Record<string, number>,
  id: string,
  amount: number,
): void {
  const next = cents(d(amount));
  if (next === 0) return;
  bag[id] = cents(d(bag[id] ?? 0).plus(next));
}

function eventsOnBook(
  values: Record<string, VariableValue>,
  feeKey: string,
  incidenceKey: string,
  active: number,
): number {
  return cents(
    d(num(values, feeKey)).times(num(values, incidenceKey)).times(active),
  );
}

/** Book ancillary Credit LLC fees. Defaults are zero — no live-book change. */
export function applyAncillaryFees(
  acc: MonthAcc,
  values: Record<string, VariableValue>,
  events: FeeEvents,
): void {
  const n = events.newContracts;
  const active = events.active;

  add(acc.feeIn, "application", num(values, "fee.applicationUsd") * n);
  add(acc.feeIn, "document", num(values, "fee.documentUsd") * n);
  add(acc.feeIn, "creditReport", num(values, "fee.creditReportUsd") * n);
  add(acc.feeIn, "titleStudy", num(values, "fee.titleStudyUsd") * n);
  add(acc.feeIn, "wireIn", num(values, "fee.wireInUsd") * n);

  add(acc.feeIn, "late", eventsOnBook(values, "fee.lateUsd", "fee.lateIncidencePct", active));
  add(acc.feeIn, "nsf", eventsOnBook(values, "fee.nsfUsd", "fee.nsfIncidencePct", active));
  add(acc.feeIn, "statement", num(values, "fee.statementUsd") * active);
  add(acc.feeIn, "modification", eventsOnBook(values, "fee.modificationUsd", "fee.modIncidencePct", active));
  add(acc.feeIn, "assumption", eventsOnBook(values, "fee.assumptionUsd", "fee.assumptionIncidencePct", active));
  add(acc.feeIn, "extension", eventsOnBook(values, "fee.extensionUsd", "fee.extensionIncidencePct", active));
  add(acc.feeIn, "payoffQuote", eventsOnBook(values, "fee.payoffQuoteUsd", "fee.payoffIncidencePct", active));
  add(acc.feeIn, "purchaseOption", num(values, "fee.purchaseOptionUsd") * events.balloons);
  add(acc.feeIn, "disposition", num(values, "fee.dispositionUsd") * events.balloons);
  add(
    acc.feeIn,
    "prepay",
    cents(
      d(events.fundedAum)
        .times(num(values, "fee.prepayPenaltyPct"))
        .times(num(values, "fee.prepayIncidencePct")),
    ),
  );
  add(acc.feeIn, "default", eventsOnBook(values, "fee.defaultUsd", "fee.defaultIncidencePct", active));
  add(acc.feeIn, "collection", eventsOnBook(values, "fee.collectionUsd", "fee.defaultIncidencePct", active));
  add(
    acc.feeIn,
    "forcedPlace",
    eventsOnBook(values, "fee.forcedPlaceUsd", "fee.forcedPlaceIncidencePct", active),
  );

  const minServicing = num(values, "fee.minServicingUsd");
  if (minServicing > 0 && active > 0) {
    const floor = cents(d(minServicing).times(active));
    add(acc.feeIn, "minServicing", Math.max(0, floor - events.servicingUsd));
  }

  const undrawn = Math.max(0, events.committedLine - events.fundedAum);
  add(acc.feeOut, "unusedLine", cents(d(undrawn).times(num(values, "fee.unusedLineBps")).div(12)));
  add(acc.feeOut, "fxHedge", cents(d(events.fundedAum).times(num(values, "fee.fxHedgeBps")).div(12)));
  add(
    acc.feeOut,
    "referring",
    cents(
      d(events.fundedNew)
        .times(num(values, "fee.referringCostPct"))
        .plus(d(num(values, "fee.referringCostUsd")).times(n)),
    ),
  );
  add(acc.feeOut, "bureauKyc", num(values, "fee.bureauKycUsd") * n);
  add(
    acc.feeOut,
    "backupServicer",
    cents(d(events.fundedAum).times(num(values, "fee.backupServicerBps")).div(12)),
  );
  add(acc.feeOut, "subservicer", num(values, "fee.subservicerUsd") * active);
  add(acc.feeOut, "uccFiling", num(values, "fee.uccFilingUsd") * n);
  add(acc.feeOut, "wireOut", num(values, "fee.wireOutUsd") * n);
  add(acc.feeOut, "notaryRegistro", num(values, "fee.notaryRegistroUsd") * n);
}

export function mergeFeeBags(
  dest: Record<string, number>,
  src: Record<string, number>,
): void {
  for (const [key, value] of Object.entries(src)) {
    dest[key] = cents(d(dest[key] ?? 0).plus(value));
  }
}

export function emptyFeeBags(): {
  feeIn: Record<string, number>;
  feeOut: Record<string, number>;
} {
  return {
    feeIn: Object.fromEntries(FEE_IN_IDS.map((id) => [id, 0])),
    feeOut: Object.fromEntries(FEE_OUT_IDS.map((id) => [id, 0])),
  };
}
