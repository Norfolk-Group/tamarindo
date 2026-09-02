import { ENTITY_LABELS, TAMARINDO_ENTITIES } from "@/lib/artifacts/centers";
import { isCashflowModelRequest } from "@/lib/nico/model-intent";
import { parseExcelSpecAsk } from "@/lib/nico/spec-intent";

const WORKBOOK_RE =
  /\b(workbook|worksheet|spreadsheet|\.xlsx|excel|p&l|income statement|financial model|ten-year|10-year)\b/i;

const WHOLE_RE =
  /\b(whole|family|all entit|entire|as a whole|full (family|business)|consolidated)\b/i;

const NAMED: Array<{ re: RegExp; label: string }> = [
  { re: /\b(tamarindo us|tamarindo credit|opco)\b/i, label: ENTITY_LABELS.tamarindo_us },
  { re: /\bintervest\b/i, label: ENTITY_LABELS.tamarindo_intervest },
  { re: /\bcolombia\b/i, label: ENTITY_LABELS.tamarindo_colombia },
  { re: /\bashoka\b/i, label: ENTITY_LABELS.ashoka },
];

export const WHOLE_BUSINESS_LABELS = TAMARINDO_ENTITIES.map(
  (entity) => ENTITY_LABELS[entity],
);

export function isWorkbookRequest(message: string): boolean {
  if (isCashflowModelRequest(message)) return false;
  if (parseExcelSpecAsk(message)) return false;
  return WORKBOOK_RE.test(message);
}

export function entitiesForWorkbook(message: string): string[] {
  if (WHOLE_RE.test(message)) return [...WHOLE_BUSINESS_LABELS];
  const named = NAMED.filter((row) => row.re.test(message)).map((row) => row.label);
  return named.length > 0 ? named : [...WHOLE_BUSINESS_LABELS];
}
