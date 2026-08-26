import { blendedFicoSpread } from "@/lib/model/contracts";
import { catalogByClass } from "@/lib/model/icp-catalog";
import { cents, d, monthlyRate, pmt } from "@/lib/model/money";
import type { CatalogIcpId } from "@/lib/model/types";
import { num, type VariableValue } from "@/lib/model/variables";

export type ProductKind = "auto" | "aircraft";

export type ProductQuote = {
  kind: ProductKind;
  id: CatalogIcpId;
  mixWeight: number;
  ticketUsd: number;
  fundedUsd: number;
  residualUsd: number;
  monthlyLeaseUsd: number;
  termMonths: number;
  clientRate: number;
};

function quoteFromProfile(
  kind: ProductKind,
  id: CatalogIcpId,
  values: Record<string, VariableValue>,
): ProductQuote {
  const ticket = num(values, `icp.${id}.purchasePriceUsd`);
  const term = Math.max(12, Math.round(num(values, `icp.${id}.termMonths`)));
  const rate = d(num(values, `icp.${id}.clientRate`)).plus(blendedFicoSpread(values));
  const ltv = kind === "auto" ? 0.8 : 0.7;
  const residualPct = kind === "auto" ? 0.2 : 0.25;
  const funded = cents(d(ticket).times(ltv));
  const residual = cents(d(ticket).times(residualPct));
  const payment = cents(pmt(monthlyRate(rate), term, d(funded), d(residual)));
  return {
    kind,
    id,
    mixWeight: num(values, `icp.${id}.mixWeight`),
    ticketUsd: ticket,
    fundedUsd: funded,
    residualUsd: residual,
    monthlyLeaseUsd: payment,
    termMonths: term,
    clientRate: rate.toNumber(),
  };
}

export function productQuotes(
  kind: ProductKind,
  values: Record<string, VariableValue>,
): ProductQuote[] {
  return catalogByClass(kind).map((row) => quoteFromProfile(kind, row.id, values));
}

/** Mix-weighted ticket for AUM headroom and tests. */
export function productQuote(
  kind: ProductKind,
  values: Record<string, VariableValue>,
): ProductQuote {
  const quotes = productQuotes(kind, values);
  const weights = quotes.map((row) => Math.max(0, row.mixWeight));
  const total = weights.reduce((sum, weight) => sum + weight, 0);
  if (quotes.length === 0) {
    throw new Error(`No ${kind} ICP`);
  }
  if (total <= 0) return quotes[0]!;
  const ticket = quotes.reduce(
    (sum, row, i) => sum + row.ticketUsd * (weights[i]! / total),
    0,
  );
  const term = Math.round(
    quotes.reduce((sum, row, i) => sum + row.termMonths * (weights[i]! / total), 0),
  );
  const rate = quotes.reduce(
    (sum, row, i) => sum + row.clientRate * (weights[i]! / total),
    0,
  );
  const ltv = kind === "auto" ? 0.8 : 0.7;
  const residualPct = kind === "auto" ? 0.2 : 0.25;
  const funded = cents(d(ticket).times(ltv));
  const residual = cents(d(ticket).times(residualPct));
  const payment = cents(pmt(monthlyRate(d(rate)), term, d(funded), d(residual)));
  return {
    kind,
    id: quotes[0]!.id,
    mixWeight: 1,
    ticketUsd: cents(d(ticket)),
    fundedUsd: funded,
    residualUsd: residual,
    monthlyLeaseUsd: payment,
    termMonths: term,
    clientRate: rate,
  };
}

export function pickProductQuote(quotes: ProductQuote[], originatedIndex: number): ProductQuote {
  if (quotes.length === 0) throw new Error("No product ICP");
  const weights = quotes.map((row) => Math.max(0, row.mixWeight));
  const total = weights.reduce((sum, weight) => sum + weight, 0);
  if (total <= 0) return quotes[originatedIndex % quotes.length]!;
  const slot = originatedIndex % 100;
  let cumulative = 0;
  for (let i = 0; i < quotes.length; i += 1) {
    cumulative += (weights[i]! / total) * 100;
    if (slot < cumulative) return quotes[i]!;
  }
  return quotes[quotes.length - 1]!;
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
