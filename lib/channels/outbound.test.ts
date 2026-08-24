import { afterEach, describe, expect, it, vi } from "vitest";
import { deliverOutbound } from "@/lib/channels/outbound";

const keys = [
  "RESEND_API_KEY",
  "RESEND_FROM",
  "META_ACCESS_TOKEN",
  "META_PHONE_NUMBER_ID",
  "TWILIO_ACCOUNT_SID",
  "TWILIO_AUTH_TOKEN",
  "TWILIO_FROM",
  "TWILIO_WHATSAPP_FROM",
] as const;

const snapshot = Object.fromEntries(
  keys.map((key) => [key, process.env[key]]),
);

afterEach(() => {
  for (const key of keys) {
    const value = snapshot[key];
    if (value === undefined) delete process.env[key];
    else process.env[key] = value;
  }
});

describe("deliverOutbound", () => {
  it("skips email when Resend is unconfigured", async () => {
    delete process.env.RESEND_API_KEY;
    delete process.env.RESEND_FROM;
    const fetchImpl = vi.fn();
    await expect(
      deliverOutbound(
        { channel: "email", to: "lp@example.com", body: "Hi" },
        fetchImpl,
      ),
    ).resolves.toBe("skipped");
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("posts to Resend when keys exist", async () => {
    process.env.RESEND_API_KEY = "re_test";
    process.env.RESEND_FROM = "Nico <nico@norfolk.ai>";
    const fetchImpl = vi.fn().mockResolvedValue({ ok: true });
    await expect(
      deliverOutbound(
        {
          channel: "email",
          to: "lp@example.com",
          subject: "Brief",
          body: "Approved brief.",
        },
        fetchImpl,
      ),
    ).resolves.toBe("sent");
    expect(fetchImpl).toHaveBeenCalledOnce();
    const [url, init] = fetchImpl.mock.calls[0] as [string, RequestInit];
    expect(url).toBe("https://api.resend.com/emails");
    expect(init.method).toBe("POST");
    const payload = JSON.parse(String(init.body)) as { from: string };
    expect(payload.from).toBe("Nico <nico@norfolk.ai>");
  });

  it("posts WhatsApp through Twilio sandbox when those keys exist", async () => {
    process.env.TWILIO_ACCOUNT_SID = "ACtest";
    process.env.TWILIO_AUTH_TOKEN = "token";
    process.env.TWILIO_WHATSAPP_FROM = "whatsapp:+14155238886";
    delete process.env.META_ACCESS_TOKEN;
    delete process.env.META_PHONE_NUMBER_ID;
    const fetchImpl = vi.fn().mockResolvedValue({ ok: true });
    await expect(
      deliverOutbound(
        { channel: "whatsapp", to: "+15550001111", body: "Sandbox brief" },
        fetchImpl,
      ),
    ).resolves.toBe("sent");
    const [url, init] = fetchImpl.mock.calls[0] as [string, RequestInit];
    expect(url).toContain("/Accounts/ACtest/Messages.json");
    const params = new URLSearchParams(String(init.body));
    expect(params.get("From")).toBe("whatsapp:+14155238886");
    expect(params.get("To")).toBe("whatsapp:+15550001111");
  });

  it("posts a Twilio voice call when keys exist", async () => {
    process.env.TWILIO_ACCOUNT_SID = "ACtest";
    process.env.TWILIO_AUTH_TOKEN = "token";
    process.env.TWILIO_FROM = "+15551234567";
    const fetchImpl = vi.fn().mockResolvedValue({ ok: true });
    await expect(
      deliverOutbound(
        {
          channel: "call",
          to: "+15550001111",
          body: "I'm Nico, Tamarindo's AI consultant — not a human.",
        },
        fetchImpl,
      ),
    ).resolves.toBe("sent");
    const [url, init] = fetchImpl.mock.calls[0] as [string, RequestInit];
    expect(url).toContain("/Calls.json");
    const params = new URLSearchParams(String(init.body));
    expect(params.get("To")).toBe("+15550001111");
    expect(params.get("Twiml")).toContain("I'm Nico");
  });

  it("throws when Resend returns an error so approval can restore", async () => {
    process.env.RESEND_API_KEY = "re_test";
    process.env.RESEND_FROM = "Nico <nico@norfolk.ai>";
    const fetchImpl = vi.fn().mockResolvedValue({ ok: false, status: 401 });
    await expect(
      deliverOutbound(
        { channel: "email", to: "lp@example.com", body: "Hi" },
        fetchImpl,
      ),
    ).rejects.toThrow(/resend_failed 401/);
  });
});
