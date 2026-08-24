import { createHmac, timingSafeEqual } from "node:crypto";

export const WEBHOOK_SKEW_MS = 5 * 60 * 1000;

export class WebhookVerifyError extends Error {
  readonly code = "webhook_unverified";
  constructor(message: string) {
    super(message);
  }
}

export function assertFreshTimestamp(unixSeconds: number, nowMs = Date.now()): void {
  const skew = Math.abs(nowMs - unixSeconds * 1000);
  if (skew > WEBHOOK_SKEW_MS) {
    throw new WebhookVerifyError("Webhook timestamp is older than 5 minutes");
  }
}

function safeEqual(a: string, b: string): boolean {
  const left = Buffer.from(a);
  const right = Buffer.from(b);
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}

/** Meta Cloud API: `X-Hub-Signature-256: sha256=<hex>`. */
export function verifyMetaSignature(rawBody: string, header: string | null, appSecret: string): void {
  if (!header?.startsWith("sha256=")) {
    throw new WebhookVerifyError("Missing X-Hub-Signature-256");
  }
  const expected = `sha256=${createHmac("sha256", appSecret).update(rawBody).digest("hex")}`;
  if (!safeEqual(expected, header)) {
    throw new WebhookVerifyError("Invalid X-Hub-Signature-256");
  }
}

export function twilioSignedPayload(
  url: string,
  params: Record<string, string>,
): string {
  const pairs = Object.keys(params)
    .sort()
    .map((key) => `${key}${params[key]}`)
    .join("");
  return `${url}${pairs}`;
}

/** Twilio: HMAC-SHA1 of URL + sorted key/value pairs, Base64. */
export function verifyTwilioSignature(
  url: string,
  params: Record<string, string>,
  header: string | null,
  authToken: string,
): void {
  if (!header) throw new WebhookVerifyError("Missing X-Twilio-Signature");
  const expected = createHmac("sha1", authToken)
    .update(twilioSignedPayload(url, params))
    .digest("base64");
  if (!safeEqual(expected, header)) {
    throw new WebhookVerifyError("Invalid X-Twilio-Signature");
  }
}

/** Recall shared secret, optional unix timestamp header. */
export function verifyRecallSecret(
  header: string | null,
  sharedSecret: string,
  timestampSeconds?: string | null,
  nowMs = Date.now(),
): void {
  if (!header || !safeEqual(header, sharedSecret)) {
    throw new WebhookVerifyError("Invalid Recall shared secret");
  }
  if (timestampSeconds) {
    const unix = Number(timestampSeconds);
    if (!Number.isFinite(unix)) throw new WebhookVerifyError("Invalid Recall timestamp");
    assertFreshTimestamp(unix, nowMs);
  }
}

/** Svix / Resend: `webhook-id`, `webhook-timestamp`, `webhook-signature` (`v1,<b64>`). */
export function verifySvixSignature(
  rawBody: string,
  id: string | null,
  timestamp: string | null,
  signatureHeader: string | null,
  secret: string,
  nowMs = Date.now(),
): void {
  if (!id || !timestamp || !signatureHeader) {
    throw new WebhookVerifyError("Missing Svix signature headers");
  }
  const unix = Number(timestamp);
  if (!Number.isFinite(unix)) throw new WebhookVerifyError("Invalid Svix timestamp");
  assertFreshTimestamp(unix, nowMs);
  const signed = `${id}.${timestamp}.${rawBody}`;
  const expected = createHmac("sha256", svixSecretBytes(secret)).update(signed).digest("base64");
  const candidates = signatureHeader
    .split(" ")
    .map((part) => part.trim())
    .filter((part) => part.startsWith("v1,"))
    .map((part) => part.slice(3));
  if (!candidates.some((candidate) => safeEqual(candidate, expected))) {
    throw new WebhookVerifyError("Invalid Svix signature");
  }
}

function svixSecretBytes(secret: string): Buffer {
  const trimmed = secret.startsWith("whsec_") ? secret.slice(6) : secret;
  try {
    return Buffer.from(trimmed, "base64");
  } catch {
    return Buffer.from(secret);
  }
}
