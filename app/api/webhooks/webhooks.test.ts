import { createHmac } from "node:crypto";
import { afterEach, describe, expect, it, vi } from "vitest";

const emitInbound = vi.hoisted(() => vi.fn());

vi.mock("@/lib/channels/inbound", () => ({ emitInbound }));

import { POST as metaPost } from "@/app/api/webhooks/meta/route";
import { POST as recallPost } from "@/app/api/webhooks/recall/route";
import { POST as resendPost } from "@/app/api/webhooks/resend/route";
import { POST as twilioPost } from "@/app/api/webhooks/twilio/route";

describe("channel webhooks", () => {
  afterEach(() => {
    delete process.env.META_APP_SECRET;
    delete process.env.TWILIO_AUTH_TOKEN;
    delete process.env.RECALL_WEBHOOK_SECRET;
    delete process.env.RESEND_WEBHOOK_SECRET;
  });

  it("rejects an unverified Meta signature (AE7 error)", async () => {
    process.env.META_APP_SECRET = "app-secret";
    const res = await metaPost(
      new Request("https://tamarindo.example/api/webhooks/meta", {
        method: "POST",
        headers: { "x-hub-signature-256": "sha256=deadbeef" },
        body: "{}",
      }),
    );
    expect(res.status).toBe(401);
    expect(emitInbound).not.toHaveBeenCalled();
  });

  it("rejects an unverified Twilio signature", async () => {
    process.env.TWILIO_AUTH_TOKEN = "token";
    const res = await twilioPost(
      new Request("https://tamarindo.example/api/webhooks/twilio", {
        method: "POST",
        headers: { "x-twilio-signature": "nope" },
        body: "Body=hi",
      }),
    );
    expect(res.status).toBe(401);
  });

  it("rejects an unverified Recall secret", async () => {
    process.env.RECALL_WEBHOOK_SECRET = "s3cret";
    const res = await recallPost(
      new Request("https://tamarindo.example/api/webhooks/recall", {
        method: "POST",
        headers: { "x-recall-secret": "nope" },
        body: "{}",
      }),
    );
    expect(res.status).toBe(401);
  });

  it("rejects an unverified Resend/Svix payload", async () => {
    process.env.RESEND_WEBHOOK_SECRET = Buffer.from("svix-secret").toString("base64");
    const now = Math.floor(Date.now() / 1000);
    const res = await resendPost(
      new Request("https://tamarindo.example/api/webhooks/resend", {
        method: "POST",
        headers: {
          "svix-id": "msg_1",
          "svix-timestamp": String(now),
          "svix-signature": "v1,nope",
        },
        body: "{}",
      }),
    );
    expect(res.status).toBe(401);
  });

  it("emits a verified Twilio WhatsApp inbound as whatsapp", async () => {
    process.env.TWILIO_AUTH_TOKEN = "token";
    emitInbound.mockResolvedValue({ kind: "emitted", conversationId: "wa1" });
    const url = "https://tamarindo.example/api/webhooks/twilio";
    const raw = "Body=hello&From=whatsapp%3A%2B15550001111";
    const params = Object.fromEntries(new URLSearchParams(raw));
    const header = createHmac("sha1", "token")
      .update(
        `${url}${Object.keys(params)
          .sort()
          .map((key) => `${key}${params[key]}`)
          .join("")}`,
      )
      .digest("base64");
    const res = await twilioPost(
      new Request(url, {
        method: "POST",
        headers: { "x-twilio-signature": header },
        body: raw,
      }),
    );
    expect(res.status).toBe(200);
    expect(emitInbound).toHaveBeenCalledWith(
      expect.objectContaining({
        channel: "whatsapp",
        message: "hello",
        phone: "+15550001111",
      }),
    );
  });

  it("emits a verified Meta inbound without communications.send", async () => {
    process.env.META_APP_SECRET = "app-secret";
    emitInbound.mockResolvedValue({ kind: "emitted", conversationId: "c1" });
    const body = JSON.stringify({
      entry: [{ changes: [{ value: { messages: [{ text: { body: "hello" } }] } }] }],
    });
    const header = `sha256=${createHmac("sha256", "app-secret").update(body).digest("hex")}`;
    const res = await metaPost(
      new Request("https://tamarindo.example/api/webhooks/meta", {
        method: "POST",
        headers: { "x-hub-signature-256": header },
        body,
      }),
    );
    expect(res.status).toBe(200);
    expect(emitInbound).toHaveBeenCalledWith(
      expect.objectContaining({ channel: "whatsapp", message: "hello" }),
    );
  });
});
