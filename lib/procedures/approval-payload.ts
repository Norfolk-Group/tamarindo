import { createHash } from "node:crypto";

/**
 * Canonical approval payload: drop `approvalId`, then stable-sort keys
 * so the same intent hashes the same way (KTD5 / AE4).
 */
export function canonicalApprovalPayload(raw: unknown): unknown {
  if (raw === null || typeof raw !== "object" || Array.isArray(raw)) {
    return raw;
  }
  const rest = { ...(raw as Record<string, unknown>) };
  delete rest.approvalId;
  return sortKeys(rest);
}

export function payloadHash(value: unknown): string {
  return createHash("sha256")
    .update(stableStringify(value))
    .digest("hex");
}

export function hashApprovalInput(raw: unknown): string {
  return payloadHash(canonicalApprovalPayload(raw));
}

function sortKeys(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sortKeys);
  if (value === null || typeof value !== "object") return value;
  const entries = Object.entries(value as Record<string, unknown>).sort(([a], [b]) =>
    a.localeCompare(b),
  );
  return Object.fromEntries(entries.map(([k, v]) => [k, sortKeys(v)]));
}

function stableStringify(value: unknown): string {
  return JSON.stringify(sortKeys(value));
}
