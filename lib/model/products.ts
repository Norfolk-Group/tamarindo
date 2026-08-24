import { blendedFicoSpread } from "@/lib/model/contracts";
import { cents, d, monthlyRate, pmt } from "@/lib/model/money";
import { num, type VariableValue } from "@/lib/model/variables";

export type ProductKind = "auto" | "aircraft";

export type ProductQuote = {
  kind: ProductKind;
  ticketUsd: number;
  fundedUsd: number;
  residualUsd: number;
  monthlyLeaseUsd: number;
  termMonths: number;
  clientRate: number;
};

/** Auto LTV 80% / aircraft 70%. Residual is of ticket, not funded. */
export function productQuote(
  kind: ProductKind,
  values: Record<string, VariableValue>,
): ProductQuote {
  const ticket = kind === "auto" ? num(values, "autoTicketUsd") : num(values, "aircraftTicketUsd");
  const term =
    kind === "auto"
      ? Math.max(12, Math.round(num(values, "autoTermMonths")))
      : Math.max(12, Math.round(num(values, "aircraftTermMonths")));
  const baseRate = kind === "auto" ? num(values, "autoClientRate") : num(values, "aircraftClientRate");
  const rate = d(baseRate).plus(blendedFicoSpread(values));
  const ltv = kind === "auto" ? 0.8 : 0.7;
  const residualPct = kind === "auto" ? 0.2 : 0.25;
  const funded = cents(d(ticket).times(ltv));
  const residual = cents(d(ticket).times(residualPct));
  const payment = cents(pmt(monthlyRate(rate), term, d(funded), d(residual)));
  return {
    kind,
    ticketUsd: ticket,
    fundedUsd: funded,
    residualUsd: residual,
    monthlyLeaseUsd: payment,
    termMonths: term,
    clientRate: rate.toNumber(),
  };
}

export function autoOriginationsThisMonth(
  values: Record<string, VariableValue>,
  monthIndex: number,
  homesThisMonth: number,
): number {
  const start = Math.round(num(values, "autoStartMonth"));
  if (monthIndex < start || homesThisMonth <= 0) return 0;
  const multiple = num(values, "autoMultipleX10") / 10;
  const extra = num(values, "autoGrowthExtraPct");
  const years = Math.max(0, Math.floor((monthIndex - start) / 12));
  const growth = d(1).plus(extra).pow(years);
  return Math.max(0, Math.round(d(homesThisMonth).times(multiple).times(growth).toNumber()));
}

export function aircraftOriginationsThisMonth(
  values: Record<string, VariableValue>,
  monthIndex: number,
): number {
  const start = Math.round(num(values, "aircraftStartMonth"));
  const perYear = Math.max(0, Math.round(num(values, "aircraftPerYear")));
  if (monthIndex < start || perYear === 0) return 0;
  const slot = (monthIndex - start) % 12;
  const already = Math.round((slot * perYear) / 12);
  const now = Math.round(((slot + 1) * perYear) / 12);
  return Math.max(0, now - already);
}
