import type { DeckVariant } from "@/lib/artifacts/raise-deck";
import { isCashflowModelRequest } from "@/lib/nico/model-intent";
import { isWorkbookRequest } from "@/lib/nico/workbook-intent";

export type DeckAsk = {
  kind: "deck" | "memo";
  variant: DeckVariant;
};

const RAISE_DRAFT_RE =
  /\b(?:working\s+raise\s+deck|raise[\s-]?draft|admin\s+deck)\b/i;

const RAISE_RE =
  /\b(?:investor\s+deck|raise\s+\.?pptx|pitch\s+deck|raise\s+deck)\b/i;

const STRUCTURE_RE =
  /\b(?:ashoka\s+memo|structure\s+(?:deck|memo|pptx|slides?))\b/i;

const MEMO_RE = /\bmemo\b/i;

/**
 * Queue the same deck/memo artifacts the UI can.
 * Cash-flow and Excel asks stay on model-intent / workbook-intent.
 */
export function parseDeckAsk(message: string): DeckAsk | null {
  const text = message.trim();
  if (!text) return null;

  if (RAISE_DRAFT_RE.test(text)) {
    return { kind: "deck", variant: "raise-draft" };
  }
  if (STRUCTURE_RE.test(text)) {
    return { kind: MEMO_RE.test(text) ? "memo" : "deck", variant: "structure" };
  }
  if (RAISE_RE.test(text)) {
    return { kind: "deck", variant: "raise" };
  }

  if (isCashflowModelRequest(text) || isWorkbookRequest(text)) {
    return null;
  }

  return null;
}
