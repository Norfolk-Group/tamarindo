/**
 * Short-lived signed assertion for the OpenNext → Nico DO handshake (KTD10).
 * Cookie sessions do not attach to the sibling Worker. The assertion binds
 * authSubject + profileId + conversationId and is verified on the DO.
 */

const DEFAULT_TTL_MS = 5 * 60 * 1000;
const encoder = new TextEncoder();

export type HandshakeClaims = {
  authSubject: string;
  profileId: string;
  conversationId: string;
  exp: number;
};

export class HandshakeError extends Error {
  readonly code = "handshake_unverified";
  constructor(message: string) {
    super(message);
  }
}

export function handshakeSecret(): string | null {
  return process.env.NICO_HANDSHAKE_SECRET || process.env.WORKOS_COOKIE_PASSWORD || null;
}

export async function signHandshake(
  claims: Omit<HandshakeClaims, "exp">,
  opts?: { ttlMs?: number; nowMs?: number; secret?: string },
): Promise<string> {
  const secret = opts?.secret ?? handshakeSecret();
  if (!secret || secret.length < 16) {
    throw new HandshakeError("Handshake secret is not configured");
  }
  const exp = (opts?.nowMs ?? Date.now()) + (opts?.ttlMs ?? DEFAULT_TTL_MS);
  const payload: HandshakeClaims = { ...claims, exp };
  const body = encodeBody(payload);
  const sig = await hmacHex(secret, body);
  return `${body}.${sig}`;
}

export async function verifyHandshake(
  token: string | null | undefined,
  opts?: { nowMs?: number; secret?: string; origin?: string | null; allowedOrigins?: string[] },
): Promise<HandshakeClaims> {
  if (!token) throw new HandshakeError("Missing handshake assertion");
  if (opts?.allowedOrigins && opts.origin) {
    if (!opts.allowedOrigins.includes(opts.origin)) {
      throw new HandshakeError("Origin is not allowed");
    }
  }
  const secret = opts?.secret ?? handshakeSecret();
  if (!secret || secret.length < 16) {
    throw new HandshakeError("Handshake secret is not configured");
  }
  const dot = token.lastIndexOf(".");
  if (dot <= 0) throw new HandshakeError("Malformed handshake assertion");
  const body = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  const expected = await hmacHex(secret, body);
  if (!timingSafeEqualHex(sig, expected)) {
    throw new HandshakeError("Invalid handshake signature");
  }
  let claims: HandshakeClaims;
  try {
    claims = JSON.parse(atob(body)) as HandshakeClaims;
  } catch {
    throw new HandshakeError("Invalid handshake payload");
  }
  if (!claims.authSubject || !claims.profileId || !claims.conversationId) {
    throw new HandshakeError("Handshake claims are incomplete");
  }
  if (claims.exp <= (opts?.nowMs ?? Date.now())) {
    throw new HandshakeError("Handshake assertion expired");
  }
  return claims;
}

function encodeBody(payload: HandshakeClaims): string {
  return btoa(JSON.stringify(payload));
}

async function hmacHex(secret: string, body: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(body));
  return [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

function timingSafeEqualHex(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let mismatch = 0;
  for (let i = 0; i < a.length; i += 1) {
    mismatch |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return mismatch === 0;
}
