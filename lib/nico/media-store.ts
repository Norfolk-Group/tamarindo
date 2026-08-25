import { handshakeSecret } from "@/lib/nico/handshake";
import { artifactObjectStore } from "@/lib/artifacts/complete-job";
import { generatedVideoKey, illustrationKey } from "@/lib/storage/r2-schema";

const encoder = new TextEncoder();

export type StoredMedia = {
  href: string;
  storageRef?: string;
  mimeType: string;
};

type MediaClaims = {
  key: string;
  mimeType: string;
  exp: number;
};

async function hmacHex(secret: string, body: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(body));
  return [...new Uint8Array(sig)]
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export async function signMediaToken(
  claims: Omit<MediaClaims, "exp">,
  ttlMs = 30 * 60 * 1000,
): Promise<string> {
  const secret = handshakeSecret();
  if (!secret || secret.length < 16) {
    throw new Error("Media signing secret is not configured");
  }
  const payload: MediaClaims = { ...claims, exp: Date.now() + ttlMs };
  const body = btoa(JSON.stringify(payload));
  return `${body}.${await hmacHex(secret, body)}`;
}

export async function verifyMediaToken(
  token: string,
): Promise<MediaClaims> {
  const secret = handshakeSecret();
  const [body, sig] = token.split(".");
  if (!body || !sig) throw new Error("bad media token");
  const expect = await hmacHex(secret, body);
  if (expect !== sig) throw new Error("bad media token");
  const claims = JSON.parse(atob(body)) as MediaClaims;
  if (claims.exp < Date.now()) throw new Error("media link expired");
  return claims;
}

function toDataUrl(mimeType: string, bytes: Uint8Array): string {
  let binary = "";
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunk));
  }
  return `data:${mimeType};base64,${btoa(binary)}`;
}

export async function persistGeneratedMedia(input: {
  kind: "image" | "video";
  mimeType: string;
  bytes: Uint8Array;
}): Promise<StoredMedia> {
  const ext = input.mimeType.includes("mp4") ? "mp4" : "png";
  const key = input.kind === "video" ? generatedVideoKey(ext) : illustrationKey(ext);
  const r2 = artifactObjectStore();
  if (r2) {
    await r2.put(key, input.bytes);
    const token = await signMediaToken({ key, mimeType: input.mimeType });
    return {
      href: `/api/nico/media?token=${encodeURIComponent(token)}`,
      storageRef: key,
      mimeType: input.mimeType,
    };
  }
  if (input.kind === "video") {
    throw new Error("Video needs the R2 binding — I have the clip in Gemini but nowhere to park it.");
  }
  if (input.bytes.byteLength > 1_800_000) {
    throw new Error("Image is too large to inline without R2.");
  }
  return { href: toDataUrl(input.mimeType, input.bytes), mimeType: input.mimeType };
}

export async function loadStoredMedia(
  key: string,
): Promise<{ bytes: Uint8Array; mimeType?: string } | null> {
  const r2 = artifactObjectStore();
  if (!r2) return null;
  const obj = await r2.get(key);
  if (!obj) return null;
  return { bytes: new Uint8Array(await obj.arrayBuffer()) };
}
