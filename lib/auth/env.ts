/**
 * WorkOS / dev-bypass env checks. Safe for Edge middleware — do not import
 * Prisma or AuthKit here.
 */

export type WorkosConfigState = "absent" | "partial" | "ready";

const COOKIE_PASSWORD_MIN = 32;

export function workosConfigState(): WorkosConfigState {
  const key = Boolean(process.env.WORKOS_API_KEY);
  const client = Boolean(process.env.WORKOS_CLIENT_ID);
  const cookie = (process.env.WORKOS_COOKIE_PASSWORD ?? "").length >= COOKIE_PASSWORD_MIN;
  const present = [key, client, cookie].filter(Boolean).length;
  if (present === 3) return "ready";
  if (present > 0) return "partial";
  return "absent";
}

/** Fallback when `WORKOS_COOKIE_MAX_AGE` is unset. Never AuthKit's 400 days. */
const SESSION_MAX_AGE_FALLBACK = 15 * 60;

/**
 * Session idle window in seconds. Drives both the AuthKit cookie (via
 * `WORKOS_COOKIE_MAX_AGE`) and the OIDC `max_age` we send to WorkOS, so an
 * expired cookie cannot be revived by a still-warm Google session.
 */
export function sessionMaxAgeSeconds(): number {
  const parsed = Number.parseInt(process.env.WORKOS_COOKIE_MAX_AGE ?? "", 10);
  return Number.isFinite(parsed) && parsed > 0
    ? parsed
    : SESSION_MAX_AGE_FALLBACK;
}

/**
 * Emails that hold admin, from the `ADMIN_EMAILS` secret (comma separated).
 * Invitations can only grant `member` or `investor`, and `dev-local` never
 * exists in production, so without this the deployed app has no admin at all.
 */
export function isOwnerEmail(email: string | undefined): boolean {
  const candidate = email?.trim().toLowerCase();
  if (!candidate) return false;
  return (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((entry) => entry.trim().toLowerCase())
    .filter(Boolean)
    .includes(candidate);
}

/** Local-only admin fallback. Preview and production never mint `dev-local`. */
export function allowDevActor(): boolean {
  if (process.env.NODE_ENV === "production") return false;
  if (process.env.ALLOW_DEV_LOCAL === "0") return false;
  if (process.env.CF_PAGES || process.env.CLOUDFLARE_ENV === "production") {
    return false;
  }
  const url = process.env.DATABASE_URL ?? "";
  return /(?:localhost|127\.0\.0\.1)/.test(url);
}
