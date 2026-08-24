import { handshakeSecret } from "@/lib/nico/handshake";

const DEFAULT_TTL_MS = 5 * 60 * 1000;
const encoder = new TextEncoder();

export type DownloadClaims = {
  artifactId: string;
  profileId: string;
  exp: number;
};

export class DownloadUrlError extends Error {
  readonly code = "download_unverified";
  constructor(message: string) {
    super(message);
  }
}

/** Procedure-issued download token. TTL ≤ 5 minutes, audience = profileId. */
export async function signDownloadToken(
  claims: Omit<DownloadClaims, "exp">,
  opts?: { ttlMs?: number; nowMs?: number; secret?: string },
): Promise<string> {
  const secret = opts?.secret ?? handshakeSecret();
  if (!secret || secret.length < 16) {
    throw new DownloadUrlError("Download signing secret is not configured");
  }
  const ttl = Math.min(opts?.ttlMs ?? DEFAULT_TTL_MS, DEFAULT_TTL_MS);
  const payload: DownloadClaims = {
    ...claims,
    exp: (opts?.nowMs ?? Date.now()) + ttl,
  };
  const body = btoa(JSON.stringify(payload));
  const sig = await hmacHex(secret, body);
  return `${body}.${sig}`;
}

export async function verifyDownloadToken(
  token: string | null | undefined,
  opts?: { nowMs?: number; secret?: string; profileId?: string },
): Promise<DownloadClaims> {
  if (!token) throw new DownloadUrlError("Missing download token");
  const secret = opts?.secret ?? handshakeSecret();
  if (!secret || secret.length < 16) {
    throw new DownloadUrlError("Download signing secret is not configured");
  }
  const dot = token.lastIndexOf(".");
  if (dot <= 0) throw new DownloadUrlError("Malformed download token");
  const body = token.slice(0, dot);
  const sig = token.slice(dot + 1);
  const expected = await hmacHex(secret, body);
  if (sig !== expected) throw new DownloadUrlError("Invalid download token");
  let claims: DownloadClaims;
  try {
    claims = JSON.parse(atob(body)) as DownloadClaims;
  } catch {
    throw new DownloadUrlError("Invalid download payload");
  }
  if (!claims.artifactId || !claims.profileId) {
    throw new DownloadUrlError("Download claims are incomplete");
  }
  if (claims.exp <= (opts?.nowMs ?? Date.now())) {
    throw new DownloadUrlError("Download token expired");
  }
  if (opts?.profileId && opts.profileId !== claims.profileId) {
    throw new DownloadUrlError("Download token audience mismatch");
  }
  return claims;
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
