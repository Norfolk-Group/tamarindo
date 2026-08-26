/**
 * “How does Tamarindo work?” is a financing brief, not the Help catalog
 * and not a thesis dump.
 */

const EXPLAIN_RE =
  /\b(how does (tamarindo|the (business|model|deal|structure)|this (business|model)) work|explain (tamarindo|the (business|model|deal|structure|thesis))|walk me through (tamarindo|the (business|model|deal|structure))|what (is|does) tamarindo( do)?\b|business model)\b/i;

const STEAL_RE =
  /\b(icp[-\s]?\d|auto[-\s]?\d|air(?:craft)?[-\s]?\d|investor returns?|sensitivity|income statement|p&l|financial statements?|worksheet|workbook|excel|help me build)\b/i;

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
}): string {
  return [
    "Tamarindo is a US-law lease on Colombia assets. Homes first, then cars, then aircraft — only if the deal matches an Ideal Contract Profile. The lessee pays Intervest (down, remittance, balloon). OpCo takes a strip. The Colombia sucursal bills clients. Five equal partners; $6.5M equity across three rounds. Intervest is the funding vehicle, not OpCo cash and not on the cap table.",
    `Live book: ${summary.homesOriginated} homes, ${summary.autosOriginated} autos, ${summary.aircraftOriginated} aircraft. Consolidated cash FY1 ${summary.fy1ClosingCashUsd}, FY10 ${summary.fy10ClosingCashUsd}. I do not invent an exit IRR or a raise. Ask for statements, investor returns, or a sensitivity and I will run the engine — glance here, full book / PDF / CSV from that tab, Excel from Artifacts.`,
    "Answer in two short paragraphs. Do not recite the thesis. Do not stack TAM or diaspora. The numbers above are the live model.",
  ].join(" ");
}
