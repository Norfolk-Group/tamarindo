/**
 * Session gate used by middleware. Keep this file free of AuthKit imports
 * so unit tests do not load `server-only`.
 */

export const PUBLIC_EXACT_PATHS = new Set([
  "/api/health",
  "/sign-in",
  "/login",
  "/callback",
  "/invite",
  "/logout",
  "/favicon.ico",
  "/icon",
  "/apple-icon",
]);

/** Named provider webhooks + the DO attach path (KTD10). The handshake
 * issuer (`/api/nico/handshake`) stays session-gated. Invite accept is
 * guest-only (A5) and Turnstile-gated. */
export const PUBLIC_PREFIXES = [
  "/api/webhooks/",
  "/agents/",
  "/api/invite/",
] as const;

export type GateDecision =
  | { action: "allow" }
  | { action: "redirect"; to: "/sign-in" }
  | { action: "unauthorized" };

export function isPublicPath(pathname: string): boolean {
  if (PUBLIC_EXACT_PATHS.has(pathname)) return true;
  return PUBLIC_PREFIXES.some((prefix) => matchesPrefix(pathname, prefix));
}

function matchesPrefix(pathname: string, prefix: string): boolean {
  if (prefix.endsWith("/")) {
    return pathname === prefix.slice(0, -1) || pathname.startsWith(prefix);
  }
  return pathname === prefix || pathname.startsWith(`${prefix}/`);
}

export function isApiPath(pathname: string): boolean {
  return pathname === "/api" || pathname.startsWith("/api/");
}

/**
 * Decide whether a request proceeds, redirects to `/sign-in`, or 401s.
 * `allowDevBypass` is only true when WorkOS is absent and KTD14 allows it.
 */
export function sessionGate(
  pathname: string,
  hasSession: boolean,
  opts: { allowDevBypass: boolean },
): GateDecision {
  if (isPublicPath(pathname)) return { action: "allow" };
  if (hasSession) return { action: "allow" };
  if (opts.allowDevBypass) return { action: "allow" };
  if (isApiPath(pathname)) return { action: "unauthorized" };
  return { action: "redirect", to: "/sign-in" };
}
