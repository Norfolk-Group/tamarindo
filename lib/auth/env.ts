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
