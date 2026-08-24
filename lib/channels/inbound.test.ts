import { afterEach, describe, expect, it, vi } from "vitest";

const actorFromChannel = vi.hoisted(() => vi.fn());
const signHandshake = vi.hoisted(() => vi.fn());
const profileIdFor = vi.hoisted(() => vi.fn());

vi.mock("@/lib/channels/actor", () => ({ actorFromChannel }));
vi.mock("@/lib/nico/handshake", () => ({ signHandshake }));
vi.mock("@/lib/procedures/profile", () => ({ profileIdFor }));

import { emitInbound } from "@/lib/channels/inbound";
import { NICO_AI_DISCLOSURE } from "@/lib/channels/window";

describe("emitInbound", () => {
  const previous = process.env.NICO_AGENT_URL;

  afterEach(() => {
    if (previous === undefined) delete process.env.NICO_AGENT_URL;
    else process.env.NICO_AGENT_URL = previous;
    actorFromChannel.mockReset();
    signHandshake.mockReset();
    profileIdFor.mockReset();
    vi.unstubAllGlobals();
  });

  it("does not free-form WhatsApp outside the 24-hour window (AE7 edge)", async () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    const result = await emitInbound({
      channel: "whatsapp",
      message: "hello",
      lastInboundAt: new Date(Date.now() - 25 * 60 * 60 * 1000),
    });
    expect(result).toEqual({
      kind: "template",
      disclosure: NICO_AI_DISCLOSURE,
    });
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("emits to the DO and does not call communications.send", async () => {
    process.env.NICO_AGENT_URL = "https://nico-agent.example";
    actorFromChannel.mockResolvedValue({
      kind: "user",
      id: "user_1",
      displayName: "Rossi",
      role: "investor",
    });
    profileIdFor.mockResolvedValue("prof_1");
    signHandshake.mockResolvedValue("tok");
    const fetchMock = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal("fetch", fetchMock);

    const result = await emitInbound({
      channel: "whatsapp",
      message: "in window",
      email: "rossi@example.com",
      lastInboundAt: new Date(),
    });
    expect(result.kind).toBe("emitted");
    expect(fetchMock.mock.calls[0]?.[0].toString()).toContain("/turn");
  });

  it("maps an unknown sender to guest and still emits (AE7 edge)", async () => {
    process.env.NICO_AGENT_URL = "https://nico-agent.example";
    actorFromChannel.mockResolvedValue({
      kind: "user",
      id: "guest:unmapped",
      displayName: "Guest",
      role: "guest",
    });
    signHandshake.mockResolvedValue("tok");
    const fetchMock = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal("fetch", fetchMock);
    const result = await emitInbound({
      channel: "sms",
      message: "who is this",
      phone: "+15550000",
    });
    expect(result.kind).toBe("emitted");
    expect(profileIdFor).not.toHaveBeenCalled();
  });
});
