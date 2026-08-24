import { createHmac } from "node:crypto";
import { describe, expect, it } from "vitest";
import {
  assertFreshTimestamp,
  twilioSignedPayload,
  verifyMetaSignature,
  verifyRecallSecret,
  verifySvixSignature,
  verifyTwilioSignature,
} from "@/lib/channels/verify";

describe("webhook verify", () => {
  it("accepts a valid Meta signature and rejects a bad one", () => {
    const body = '{"ok":true}';
    const secret = "app-secret";
    const header = `sha256=${createHmac("sha256", secret).update(body).digest("hex")}`;
    expect(() => verifyMetaSignature(body, header, secret)).not.toThrow();
    expect(() => verifyMetaSignature(body, header, "other")).toThrow(/Invalid/);
  });

  it("accepts a valid Twilio signature over URL + sorted params", () => {
    const url = "https://tamarindo.example/api/twilio";
    const params = { Body: "hi", From: "+15551212" };
    const token = "twilio-token";
    const header = createHmac("sha1", token)
      .update(twilioSignedPayload(url, params))
      .digest("base64");
    expect(() => verifyTwilioSignature(url, params, header, token)).not.toThrow();
    expect(() => verifyTwilioSignature(url, params, header, "nope")).toThrow(/Invalid/);
  });

  it("rejects a Recall secret mismatch and a stale timestamp", () => {
    const now = Date.parse("2026-08-22T01:00:00Z");
    const unix = String(Math.floor(now / 1000));
    expect(() => verifyRecallSecret("s3cret", "s3cret", unix, now)).not.toThrow();
    expect(() => verifyRecallSecret("nope", "s3cret")).toThrow(/Invalid/);
    expect(() =>
      verifyRecallSecret("s3cret", "s3cret", String(Math.floor((now - 10 * 60 * 1000) / 1000)), now),
    ).toThrow(/5 minutes/);
  });

  it("rejects Svix payloads outside the 5-minute skew", () => {
    const now = Date.parse("2026-08-22T01:00:00Z");
    const ts = String(Math.floor(now / 1000));
    const id = "msg_1";
    const body = "{}";
    const secret = Buffer.from("svix-secret").toString("base64");
    const sig = createHmac("sha256", Buffer.from(secret, "base64"))
      .update(`${id}.${ts}.${body}`)
      .digest("base64");
    expect(() =>
      verifySvixSignature(body, id, ts, `v1,${sig}`, secret, now),
    ).not.toThrow();
    expect(() =>
      verifySvixSignature(body, id, String(Math.floor(now / 1000) - 400), `v1,${sig}`, secret, now),
    ).toThrow(/5 minutes/);
    expect(() => assertFreshTimestamp(Math.floor(now / 1000) - 400, now)).toThrow();
  });
});
