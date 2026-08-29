/**
 * Procedures the model may call while composing an answer from a live
 * snapshot. Writes stay off so a report turn cannot re-set the case.
 */
export const LIVE_READ_PROCEDURES = [
  "knowledge.search",
  "model.get",
  "model.report",
  "model.listScenarios",
  "model.diffScenarios",
  "model.explain",
  "ticker.list",
  "news.headlines",
  "weather.get",
  "markets.get",
  "help.list",
  "help.get",
] as const;

export const LIVE_READ_PROCEDURE_SET = new Set<string>(LIVE_READ_PROCEDURES);

export function isLiveWriteTurn(input: {
  variableSet?: unknown;
  workbook?: boolean;
  deck?: unknown;
  scenarioKind?: "save" | "load" | "compare";
  media?: boolean;
}): boolean {
  if (input.media) return true;
  if (input.variableSet) return true;
  if (input.workbook) return true;
  if (input.deck) return true;
  return input.scenarioKind === "save" || input.scenarioKind === "load";
}
