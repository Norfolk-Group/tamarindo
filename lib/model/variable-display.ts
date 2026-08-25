import type { VariableType, VariableValue } from "@/lib/model/types";

function niceNumber(value: number): string {
  if (Number.isInteger(value)) return String(value);
  return String(Math.round(value * 1000) / 1000);
}

/** Form field text. Percents show as 40, not 0.4. */
export function toDraftValue(type: VariableType, value: VariableValue): string {
  if (type === "percent" && typeof value === "number") {
    return niceNumber(value * 100);
  }
  return String(value);
}

/** Parse a form field back to the engine unit. Percents are typed as 40. */
export function fromDraftValue(type: VariableType, raw: string): VariableValue {
  if (type === "text") return raw;
  const n = Number(raw);
  if (!Number.isFinite(n)) return 0;
  if (type === "percent") return n / 100;
  return n;
}

export function formatVariableValue(type: VariableType, value: VariableValue): string {
  if (type === "percent" && typeof value === "number") {
    return `${niceNumber(value * 100)}%`;
  }
  if (type === "usd" && typeof value === "number") {
    return `$${value.toLocaleString()}`;
  }
  return String(value);
}
