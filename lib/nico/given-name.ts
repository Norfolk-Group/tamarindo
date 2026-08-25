const EMAIL_RE = /@/;
const SUBJECT_RE = /^user[_-]/i;
const GIVEN_RE = /^[\p{L}][\p{L}'’-]*$/u;
const GIVEN_STOP = new Set([
  "here",
  "ready",
  "back",
  "good",
  "fine",
  "by",
  "my",
  "the",
  "a",
  "an",
  "you",
  "me",
  "us",
  "just",
  "not",
]);
const INTRO_RE =
  /(?:(?:my name is|i am|i['’]m|call me|this is)\s+)([\p{L}][\p{L}'’-]{1,40})/iu;

export type AddressStyle = "first" | "formal" | "unknown";

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
  if (GIVEN_STOP.has(first.toLowerCase())) return null;
  return first;
}

/** Last token of a real display name, or null if there is no family name. */
export function familyNameFromDisplayName(
  displayName: string | null | undefined,
): string | null {
  if (!displayName?.trim()) return null;
  const cleaned = displayName.replace(/\(.*?\)/g, "").trim();
  const parts = cleaned.split(/\s+/).filter(Boolean);
  if (parts.length < 2) return null;
  const last = parts[parts.length - 1] ?? "";
  if (last.length < 2) return null;
  if (EMAIL_RE.test(last) || SUBJECT_RE.test(last)) return null;
  if (!GIVEN_RE.test(last)) return null;
  return last;
}

/** Name the user just offered in chat ("I'm Luca", "call me Sam"). */
export function offeredGivenName(message: string): string | null {
  const match = message.match(INTRO_RE);
  const offered = match?.[1]?.trim();
  if (!offered) return null;
  return givenNameFromDisplayName(offered);
}

const EXPLICIT_FIRST =
  /(?:you (?:can|may) call me|call me by (?:my )?first name|first name is fine|use my first name)/i;
const EXPLICIT_FORMAL =
  /(?:don'?t (?:call me|use my first)|please don'?t use my first|use my last name|call me (?:mr|ms|mrs|dr)\b)/i;
const SHORT_YES =
  /^(yes|yeah|yep|yup|sure|ok|okay|of course|please do|go ahead|absolutely|fine|you (?:can|may)|that'?s fine)\b/i;
const SHORT_NO = /^(no|nope|nah|please don'?t|do not|don'?t)\b/i;

/**
 * Whether the person just said Nico may use a first name.
 * Short yes/no only counts when Nico just asked.
 */
export function parseAddressConsent(
  message: string,
  opts: { pendingAsk?: boolean } = {},
): AddressStyle | null {
  const text = message.trim();
  if (!text) return null;
  if (EXPLICIT_FORMAL.test(text)) return "formal";
  if (EXPLICIT_FIRST.test(text)) return "first";
  if (offeredGivenName(text)) return "first";
  if (!opts.pendingAsk) return null;
  if (text.length > 80) return null;
  if (SHORT_YES.test(text)) return "first";
  if (SHORT_NO.test(text)) return "formal";
  return null;
}

export function addressStyleFromMemory(notes: string): AddressStyle {
  if (!notes) return "unknown";
  if (
    /must not use this person'?s first name|should not use.{0,40}first name|declined.{0,40}first name|last name only/i.test(
      notes,
    )
  ) {
    return "formal";
  }
  if (/may call this person by first name|use first name/i.test(notes)) {
    return "first";
  }
  return "unknown";
}

/** True when an earlier Nico reply already asked the first-name question. */
export function askedGivenNamePermission(assistantText: string): boolean {
  return /(?:may|can|could) I (?:keep )?(?:call|use).{0,60}first name|mind if I (?:keep )?(?:using|calling)|first name or not|rather I didn'?t/i.test(
    assistantText,
  );
}

export function addressPreferenceNote(
  style: AddressStyle,
  givenName?: string | null,
): { kind: "preference"; text: string } | null {
  if (style === "first") {
    const name = givenName ? ` (${givenName})` : "";
    return {
      kind: "preference",
      text: `Nico may call this person by first name${name}`,
    };
  }
  if (style === "formal") {
    return {
      kind: "preference",
      text: "Nico must not use this person's first name; they declined",
    };
  }
  return null;
}
