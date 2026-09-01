/**
 * “How does Tamarindo work?” is a financing brief, not the Help catalog
 * and not a thesis dump.
 */

const EXPLAIN_RE =
  /\b(how does (tamarindo|the (business|model|deal|structure)|this (business|model|product)) work|explain (tamarindo|the (business|model|deal|structure|thesis|product))|walk me through (tamarindo|the (business|model|deal|structure))|what (is|does) tamarindo( do)?\b|what is the product|business model|c[oó]mo funciona (tamarindo|el (negocio|modelo|producto|deal|estructura))|expl[ií]ca(me)? (tamarindo|el (negocio|modelo|producto|tesis))|qu[eé] (es|hace) tamarindo|cu[aá]l es el producto|modelo de negocio)\b/i;

const STEAL_RE =
  /\b(icp[-\s]?\d|auto[-\s]?\d|air(?:craft)?[-\s]?\d|investor returns?|sensitivity|income statement|p&l|financial statements?|corporate structure|entity map|worksheet|workbook|excel|help me build|unit economics|what (do|would) we (make|earn|take)|estados? financieros?|flujo de caja|cu[aá]nto (ganamos|nos llevamos)|prueba de estr[eé]s)\b/i;

export function parseBusinessExplainAsk(message: string): boolean {
  const text = message.trim();
  if (!text) return false;
  if (STEAL_RE.test(text)) return false;
  return EXPLAIN_RE.test(text);
}

export function formatBusinessBrief(summary: {
  homesOriginated: number;
  autosOriginated: number;
  aircraftOriginated: number;
  fy1ClosingCashUsd: number;
  fy10ClosingCashUsd: number;
  originationFeePct?: number;
  servicingBps?: number;
  activationFeePct?: number;
  spreadSharePct?: number;
}): string {
  const orig = summary.originationFeePct ?? 0.01;
  const serv = summary.servicingBps ?? 0.0075;
  const act = summary.activationFeePct ?? 0.02;
  const spread = summary.spreadSharePct ?? 0.2;
  return [
    "LIVE SNAPSHOT — compose two short paragraphs. Do not recite this block. Do not invent an exit IRR or a raise.",
    "Product: US-law lease-to-own platform. Prime US credit → use of a Colombian hard asset (homes first). Title in a replaceable vehicle sucursal. Client: US lease, ~40% down, material balloon. Not a mortgage, not leasing habitacional, not a broker. InterVest is the first warehouse (leased assets + specialty-finance platforms), not the brand.",
    "Lessee pays Intervest. OpCo originates/services and takes a strip. Colombia sucursal bills. Five equal partners; $6.5M equity, three rounds. Intervest funds the book — not OpCo cash, not the cap table.",
    `Live seeds: origination ${(orig * 100).toFixed(2)}% of funded, servicing ${(serv * 10_000).toFixed(0)} bps of outstanding, activation ${(act * 100).toFixed(0)}% of draw, spread ${(spread * 100).toFixed(0)}% of interest. WhatsApp 1.50%/40 bps is not this book unless these keys say so.`,
    `Live book: ${summary.homesOriginated} homes, ${summary.autosOriginated} autos, ${summary.aircraftOriginated} aircraft. Cash FY1 ${summary.fy1ClosingCashUsd}, FY10 ${summary.fy10ClosingCashUsd}.`,
    "Speak the user's language this turn (English or Spanish). Doors: statements, returns, sensitivity, corporate structure, ticket math — glance here; full book / PDF / CSV / Excel from that glance. Queued workbooks live in Files in the left rail, not Artifacts. No TAM, no diaspora.",
  ].join(" ");
}
