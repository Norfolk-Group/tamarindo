import { afterEach, describe, expect, it, vi } from "vitest";

const findUnique = vi.hoisted(() => vi.fn());

vi.mock("@/lib/db", () => ({
  prisma: { conversation: { findUnique } },
}));

import { notifyWaitingSession } from "@/lib/nico/notify-session";

describe("notifyWaitingSession", () => {
  const previous = process.env.NICO_AGENT_URL;

  afterEach(() => {
    if (previous === undefined) delete process.env.NICO_AGENT_URL;
    else process.env.NICO_AGENT_URL = previous;
    vi.unstubAllGlobals();
  });

  it("no-ops without a sibling Worker URL", async () => {
    delete process.env.NICO_AGENT_URL;
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    await notifyWaitingSession("conv_1", "appr_1");
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("POSTs sessionKey + approvalId when configured", async () => {
    process.env.NICO_AGENT_URL = "https://nico-agent.example";
    findUnique.mockResolvedValue({ profileId: "prof_1" });
    const fetchMock = vi.fn().mockResolvedValue({ ok: true });
    vi.stubGlobal("fetch", fetchMock);
    await notifyWaitingSession("conv_1", "appr_1");
    expect(fetchMock).toHaveBeenCalledWith(
      new URL("/resume", "https://nico-agent.example"),
      expect.objectContaining({
        method: "POST",
        body: JSON.stringify({
          conversationId: "conv_1",
          approvalId: "appr_1",
          sessionKey: "prof_1:conv_1",
        }),
      }),
    );
  });
});
