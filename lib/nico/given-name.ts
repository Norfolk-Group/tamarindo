const EMAIL_RE = /@/;
const SUBJECT_RE = /^user[_-]/i;
const GIVEN_RE = /^[\p{L}][\p{L}'’-]*$/u;
const INTRO_RE =
  /(?:(?:my name is|i am|i['’]m|call me|this is)\s+)([\p{L}][\p{L}'’-]{1,40})/iu;

/** First name from a display string, or null if it is not a real given name. */
export function givenNameFromDisplayName(
  displayName: string | null | undefined,
): string | null {
  if (!displayName?.trim()) return null;
  const cleaned = displayName.replace(/\(.*?\)/g, "").trim();
  const first = cleaned.split(/\s+/)[0] ?? "";
  if (first.length < 2) return null;
  if (EMAIL_RE.test(first) || SUBJECT_RE.test(first)) return null;
  if (!GIVEN_RE.test(first)) return null;
  return first;
}

/** Name the user just offered in chat ("I'm Luca", "call me Sam"). */
export function offeredGivenName(message: string): string | null {
  const match = message.match(INTRO_RE);
  const offered = match?.[1]?.trim();
  if (!offered) return null;
  return givenNameFromDisplayName(offered);
}
