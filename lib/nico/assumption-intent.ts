import { formatUsd } from "@/lib/model/format";
import { formatVariableValue } from "@/lib/model/variable-display";
import { VARIABLE_DEFS } from "@/lib/model/variables";

const SHOW_RE = /\b(show|list|what are|open)\b/i;
const NOUN_RE = /\b(assumptions?|inputs?|blue variables?)\b/i;

const SAVE_AS_RE = /\bsave this as\s+(.+)$/i;
const LOAD_RE = /\b(?:load|apply)\s+(.+)$/i;
const COMPARE_RE = /\bcompare\s+(.+?)\s+and\s+(.+)$/i;

/** Do not steal personal-case writes, reports, or sensitivity shocks. */
const SET_VARIABLE_RE =
  /\b(set|change|dial|update|move)\b[\s\S]{0,80}\b(to|at|=)\b/i;
const SENSITIVITY_RE =
  /\b(sensitivity|tornado|what[- ]if grid|shock (the )?(residual|balloon|down|ltv))\b/i;
const LOAD_STEAL_RE =
  /\b(financial statements?|statement of cash|cash ?flow|income statement|p&l|investor returns?|sensitivity|corporate structure|icps?|assumptions?|workbook|worksheet|entity map|deck|raise)\b/i;

const GLANCE_ROW_CAP = 12;

export type ScenarioAsk =
  | { kind: "save"; name: string }
  | { kind: "load"; name: string }
  | { kind: "compare"; nameA: string; nameB: string };

export type ScenarioDiffGlanceRow = {
  key: string;
  label: string;
  kind: string;
  fy: number | null;
  a: number;
  b: number;
  delta: number;
};

export function isAssumptionsAsk(message: string): boolean {
  const text = message.trim();
  if (!text) return false;
  return SHOW_RE.test(text) && NOUN_RE.test(text);
}

export function parseScenarioAsk(message: string): ScenarioAsk | null {
  const text = message.trim();
  if (!text) return null;
  if (SET_VARIABLE_RE.test(text) || SENSITIVITY_RE.test(text)) return null;

  const save = text.match(SAVE_AS_RE);
  if (save?.[1]) {
    const name = cleanScenarioName(save[1]);
    if (name) return { kind: "save", name };
  }

  const compare = text.match(COMPARE_RE);
  if (compare?.[1] && compare[2]) {
    const nameA = cleanScenarioName(compare[1]);
    const nameB = cleanScenarioName(compare[2]);
    if (nameA && nameB) return { kind: "compare", nameA, nameB };
  }

  const load = text.match(LOAD_RE);
  if (load?.[1]) {
    const name = cleanScenarioName(load[1]);
    if (name && !LOAD_STEAL_RE.test(name)) return { kind: "load", name };
  }

  return null;
}

export function matchScenarioByName<T extends { name: string }>(
  scenarios: T[],
  name: string,
): T | undefined {
  const needle = name.trim().toLowerCase();
  if (!needle) return undefined;
  return scenarios.find((row) => row.name.trim().toLowerCase() === needle);
}

export function namedScenarioCount<T extends { name: string }>(
  scenarios: T[],
  name: string,
): number {
  const needle = name.trim().toLowerCase();
  if (!needle) return 0;
  return scenarios.filter((row) => row.name.trim().toLowerCase() === needle).length;
}

export function pickScenarioDiffGlanceRows(
  changed: ScenarioDiffGlanceRow[],
): ScenarioDiffGlanceRow[] {
  const cash = changed.filter(isClosingCashGlanceRow);
  const inputs = changed.filter(
    (row) => row.kind === "input" && !isClosingCashGlanceRow(row),
  );
  const reserved = Math.min(cash.length, GLANCE_ROW_CAP);
  const inputSlots = GLANCE_ROW_CAP - reserved;
  return [...inputs.slice(0, inputSlots), ...cash.slice(0, reserved)].map(
    (row) => ({ ...row, label: glanceLabel(row) }),
  );
}

export function formatScenarioDiffGlance(diff: {
  scenarioA: { name: string };
  scenarioB: { name: string };
  changed: ScenarioDiffGlanceRow[];
}): string {
  const rows = pickScenarioDiffGlanceRows(diff.changed);
  const headerA = pipeSafe(diff.scenarioA.name);
  const headerB = pipeSafe(diff.scenarioB.name);
  const lines = [
    `| Input | ${headerA} | ${headerB} | Δ |`,
    "| --- | --- | --- | --- |",
    ...rows.map(
      (row) =>
        `| ${pipeSafe(row.label)} | ${formatDiffValue(row, row.a)} | ${formatDiffValue(row, row.b)} | ${formatDiffValue(row, row.delta)} |`,
    ),
  ];
  return `${lines.join("\n")}\n\n`;
}

export function formatDiffValue(
  row: ScenarioDiffGlanceRow,
  value: number,
): string {
  const def = variableDefForDiffRow(row);
  if (def) return formatVariableValue(def.type, value);
  if (isClosingCashGlanceRow(row)) return formatUsd(value);
  return String(value);
}

function glanceLabel(row: ScenarioDiffGlanceRow): string {
  if (row.key === "summary.fy1ClosingCashUsd" || row.key.endsWith(".closingCash.fy1")) {
    return "FY1 closing cash";
  }
  if (row.key === "summary.fy10ClosingCashUsd" || row.key.endsWith(".closingCash.fy10")) {
    return "FY10 closing cash";
  }
  return row.label;
}

function isClosingCashGlanceRow(row: ScenarioDiffGlanceRow): boolean {
  if (row.key === "summary.fy1ClosingCashUsd" || row.key === "summary.fy10ClosingCashUsd") {
    return true;
  }
  if (row.fy === 1 || row.fy === 10) {
    return /closing cash/i.test(row.label) || /closingCash\.fy(1|10)$/.test(row.key);
  }
  return false;
}

function variableDefForDiffRow(row: ScenarioDiffGlanceRow) {
  const key = row.key.startsWith("input.") ? row.key.slice("input.".length) : row.key;
  return VARIABLE_DEFS.find((def) => def.key === key);
}

function cleanScenarioName(raw: string): string {
  return raw
    .trim()
    .replace(/^["'`“”‘’]+|["'`“”‘’]+$/g, "")
    .replace(/[.!?]+$/g, "")
    .trim();
}

function pipeSafe(value: string): string {
  return value.replaceAll("|", "\\|");
}
