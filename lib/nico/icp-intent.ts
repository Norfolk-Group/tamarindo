import type { CatalogIcpId } from "@/lib/model/types";
import type { IcpFieldKey } from "@/lib/procedures/icp";

export type IcpAsk =
  | { kind: "list" }
  | { kind: "get"; id: CatalogIcpId }
  | { kind: "set"; id: CatalogIcpId; values: Partial<Record<IcpFieldKey, number>> }
  | { kind: "vintages"; year?: number; month?: number };

const LIST_RE =
  /\b(list|show|what are|which are|catalog|all)\b[\s\S]{0,40}\b(icps?|ideal (customer|contract) profiles?)\b/i;

const GET_RE =
  /\b(what is|what's|whats|tell me about|show|describe|explain)\b[\s\S]{0,40}\b(icp[-\s]?\d|auto[-\s]?\d|air(?:craft)?[-\s]?\d)\b/i;

const SET_RE = /\b(set|change|dial|update|move)\b[\s\S]{0,80}\b(to|at|=)\b/i;

const VINTAGE_RE =
  /\b(vintages?|originations?|planned (homes|closings|book)|homes (originated|closing))\b/i;

const ORIGINATION_FEE_RE = /\borigination fees?\b/i;

const MONTHS: Array<{ re: RegExp; month: number }> = [
  { re: /\b(jan(?:uary)?)\b/i, month: 1 },
  { re: /\b(feb(?:ruary)?)\b/i, month: 2 },
  { re: /\b(mar(?:ch)?)\b/i, month: 3 },
  { re: /\b(apr(?:il)?)\b/i, month: 4 },
  { re: /\b(may)\b/i, month: 5 },
  { re: /\b(jun(?:e)?)\b/i, month: 6 },
  { re: /\b(jul(?:y)?)\b/i, month: 7 },
  { re: /\b(aug(?:ust)?)\b/i, month: 8 },
  { re: /\b(sep(?:t(?:ember)?)?)\b/i, month: 9 },
  { re: /\b(oct(?:ober)?)\b/i, month: 10 },
  { re: /\b(nov(?:ember)?)\b/i, month: 11 },
  { re: /\b(dec(?:ember)?)\b/i, month: 12 },
];

const ICP_ALIASES: Array<{ re: RegExp; id: CatalogIcpId }> = [
  { re: /\bicp[-\s]?1\b/i, id: "icp1" },
  { re: /\bicp[-\s]?2\b/i, id: "icp2" },
  { re: /\bicp[-\s]?3\b/i, id: "icp3" },
  { re: /\bicp[-\s]?4\b/i, id: "icp4" },
  { re: /\bicp[-\s]?5\b/i, id: "icp5" },
  { re: /\bicp[-\s]?6\b/i, id: "icp6" },
  { re: /\bauto[-\s]?1\b/i, id: "auto1" },
  { re: /\bauto[-\s]?2\b/i, id: "auto2" },
  { re: /\bair(?:craft)?[-\s]?1\b/i, id: "air1" },
  { re: /\bair(?:craft)?[-\s]?2\b/i, id: "air2" },
  { re: /\b(poblado executive|el poblado)\b/i, id: "icp1" },
  { re: /\bcartagena heritage\b/i, id: "icp2" },
  { re: /\bllanogrande\b/i, id: "icp3" },
  { re: /\bbocagrande tower\b/i, id: "icp4" },
  { re: /\benvigado family\b/i, id: "icp5" },
  { re: /\bcastillo grande\b/i, id: "icp6" },
  { re: /\b(andes family prado|prado)\b/i, id: "auto1" },
  { re: /\b(city hybrid|cx-?30)\b/i, id: "auto2" },
  { re: /\b(andes caravan|caravan)\b/i, id: "air1" },
  { re: /\b(caribbean light jet|phenom)\b/i, id: "air2" },
];

const FIELD_ALIASES: Array<{
  re: RegExp;
  key: IcpFieldKey;
  scale?: number;
}> = [
  { re: /\b(purchase( price)?|price)\b/i, key: "purchasePriceUsd" },
  { re: /\bterm\b/i, key: "termMonths" },
  { re: /\b(client )?rate\b/i, key: "clientRate", scale: 0.01 },
  { re: /\b(rented( time)?|occupancy)\b/i, key: "rentedTimePct", scale: 0.01 },
  { re: /\b(rent factor|rental strength)\b/i, key: "rentFactor" },
  { re: /\b(mix( weight)?|weight)\b/i, key: "mixWeight", scale: 0.01 },
];

function icpIdIn(message: string): CatalogIcpId | null {
  const alias = ICP_ALIASES.find((row) => row.re.test(message));
  return alias?.id ?? null;
}

function monthIn(message: string): number | undefined {
  return MONTHS.find((row) => row.re.test(message))?.month;
}

function yearIn(message: string): number | undefined {
  const match = message.match(/\b(20\d{2})\b/);
  if (!match) return undefined;
  const year = Number(match[1]);
  return Number.isFinite(year) ? year : undefined;
}

function parseSetValues(
  message: string,
): Partial<Record<IcpFieldKey, number>> | null {
  const number = message.match(/\b(?:to|at|=)\s*(-?\d+(?:\.\d+)?)\s*%?/i);
  if (!number) return null;
  const raw = Number(number[1]);
  if (!Number.isFinite(raw)) return null;
  const alias = FIELD_ALIASES.find((row) => row.re.test(message));
  if (!alias) return null;
  const hasPercent = /%/.test(message);
  const value =
    alias.scale && (raw > 1 || hasPercent) ? raw * alias.scale : raw;
  return { [alias.key]: value };
}

/**
 * ICP catalog / get / set / planned vintages. Cash-flow period slices
 * stay on report-intent; the full 10-year run stays on model-intent.
 */
export function parseIcpAsk(message: string): IcpAsk | null {
  const text = message.trim();
  if (!text) return null;

  if (VINTAGE_RE.test(text) && !ORIGINATION_FEE_RE.test(text)) {
    const year = yearIn(text);
    const month = monthIn(text);
    return {
      kind: "vintages",
      ...(year !== undefined ? { year } : {}),
      ...(month !== undefined ? { month } : {}),
    };
  }

  const id = icpIdIn(text);
  if (id && SET_RE.test(text)) {
    const values = parseSetValues(text);
    if (values) return { kind: "set", id, values };
  }

  if (LIST_RE.test(text) && !id) {
    return { kind: "list" };
  }

  if (
    id &&
    (GET_RE.test(text) ||
      /^(what is|what's|whats|tell me about|show|describe|explain)\b/i.test(text))
  ) {
    return { kind: "get", id };
  }

  if (
    id &&
    text.length < 40 &&
    /\b(icp[-\s]?\d|auto[-\s]?\d|air(?:craft)?[-\s]?\d)\b/i.test(text) &&
    !/\b(balloon|residual|workbook|excel|cash ?flow|p&l)\b/i.test(text)
  ) {
    return { kind: "get", id };
  }

  if (/\b(icps?|ideal (customer|contract) profiles?)\b/i.test(text) && LIST_RE.test(text)) {
    return { kind: "list" };
  }

  return null;
}

export function isIcpRequest(message: string): boolean {
  return parseIcpAsk(message) !== null;
}
