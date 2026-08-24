export const INVITE_EMAIL_COOKIE = "nico_invite_email";

const MAX_AGE_SEC = 10 * 60;

export function inviteEmailCookieHeader(email: string): string {
  return [
    `${INVITE_EMAIL_COOKIE}=${encodeURIComponent(email)}`,
    "Path=/",
    `Max-Age=${MAX_AGE_SEC}`,
    "HttpOnly",
    "SameSite=Lax",
  ].join("; ");
}

export function readInviteEmail(
  value: string | undefined | null,
): string | undefined {
  if (!value) return undefined;
  try {
    return decodeURIComponent(value).trim().toLowerCase() || undefined;
  } catch {
    return undefined;
  }
}
