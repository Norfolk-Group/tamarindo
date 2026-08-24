const CASHFLOW_RE =
  /\b(cash ?flow|scf|statement of cash flows|ias 7|10-year plan)\b/i;

const SET_RE =
  /\b(set|change|dial|update|move)\b[\s\S]{0,80}\b(to|at|=)\b/i;

export function isCashflowModelRequest(message: string): boolean {
  return CASHFLOW_RE.test(message);
}

export function isVariableSetRequest(message: string): boolean {
  return SET_RE.test(message) && /\b(x|step-?up|mandate|opex|activation|origination|down|january|closing|admin|seed|line)\b/i.test(message);
}

const KEY_ALIASES: Array<{ re: RegExp; key: string; scale?: number }> = [
  { re: /\b(x|step-?up)\b/i, key: "lineStepUpPct", scale: 0.01 },
  { re: /\bactivation\b/i, key: "activationFeePct", scale: 0.01 },
  { re: /\borigination fee\b/i, key: "originationFeePct", scale: 0.01 },
  { re: /\bdown\b/i, key: "downPaymentPct", scale: 0.01 },
  { re: /\bseed\b/i, key: "seedEquityUsd" },
  { re: /\bus (opex|burn)\b/i, key: "usMonthlyOpexUsd" },
  { re: /\bcolombia (opex|burn)\b/i, key: "sucursalMonthlyOpexUsd" },
  { re: /\bmandate\b/i, key: "usMandateMonthlyUsd" },
  { re: /\bclosing fee\b/i, key: "coClosingFeeUsd" },
  { re: /\badmin\b/i, key: "coAdminPerLeaseUsd" },
  { re: /\bjanuary\b/i, key: "januaryCohortYear" },
];

export function parseVariableSet(
  message: string,
): Record<string, number> | null {
  if (!isVariableSetRequest(message)) return null;
  const number = message.match(/(-?\d+(?:\.\d+)?)\s*%?/);
  if (!number) return null;
  const raw = Number(number[1]);
  if (!Number.isFinite(raw)) return null;
  const alias = KEY_ALIASES.find((row) => row.re.test(message));
  if (!alias) return null;
  const value = alias.scale && raw > 1 ? raw * alias.scale : alias.scale ? raw * alias.scale : raw;
  return { [alias.key]: value };
}
