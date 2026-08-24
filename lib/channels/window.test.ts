import { describe, expect, it } from "vitest";
import { NICO_AI_DISCLOSURE, whatsappWindowOpen } from "@/lib/channels/window";

describe("WhatsApp window and disclosure", () => {
  it("is open inside 24 hours and closed after", () => {
    const inbound = new Date("2026-08-21T01:00:00Z");
    expect(whatsappWindowOpen(inbound, new Date("2026-08-22T00:59:00Z"))).toBe(true);
    expect(whatsappWindowOpen(inbound, new Date("2026-08-22T01:01:00Z"))).toBe(false);
  });

  it("discloses Nico is an AI (R11)", () => {
    expect(NICO_AI_DISCLOSURE.toLowerCase()).toContain("ai");
  });
});
