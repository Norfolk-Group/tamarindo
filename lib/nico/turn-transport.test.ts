import { afterEach, describe, expect, it, vi } from "vitest";
import { openTurnStream } from "@/lib/nico/turn-transport";

describe("openTurnStream", () => {
  const previous = process.env.NEXT_PUBLIC_NICO_AGENT_URL;

  afterEach(() => {
    if (previous === undefined) delete process.env.NEXT_PUBLIC_NICO_AGENT_URL;
    else process.env.NEXT_PUBLIC_NICO_AGENT_URL = previous;
  });

  it("refuses a local runTurn proxy when the sibling host is unset (KTD1)", async () => {
    delete process.env.NEXT_PUBLIC_NICO_AGENT_URL;
    const fetchImpl = vi.fn();
    await expect(openTurnStream("hi", "conv_1", fetchImpl)).rejects.toThrow(
      /Nico Worker host is not configured/,
    );
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it("uses the sibling /turn when host and handshake succeed", async () => {
    process.env.NEXT_PUBLIC_NICO_AGENT_URL = "https://nico-agent.example";
    const body = new ReadableStream<Uint8Array>();
    const fetchImpl = vi
      .fn()
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          ok: true,
          data: { token: "tok", profileId: "p1", conversationId: "conv_1" },
        }),
      })
      .mockResolvedValueOnce({ ok: true, body, status: 200 });

    const stream = await openTurnStream("hi", "conv_1", fetchImpl);
    expect(stream).toBe(body);
    expect(fetchImpl.mock.calls[1]?.[0]).toBe("https://nico-agent.example/turn");
  });
});
