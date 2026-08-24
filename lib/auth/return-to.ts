/** Relative-path returnTo only — refuse protocol-relative and absolute URLs. */
export function safeReturnTo(
  value: string | null | undefined,
  fallback = "/invite",
): string {
  if (!value) return fallback;
  if (!value.startsWith("/") || value.startsWith("//")) return fallback;
  return value;
}
