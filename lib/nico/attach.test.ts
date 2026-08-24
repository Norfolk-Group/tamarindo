import { describe, expect, it, vi } from "vitest";
import {
  fetchAgentMessages,
  issueHandshake,
  nicoAgentHost,
  nicoAgentHostFromEnv,
} from "@/lib/nico/attach";

describe("nicoAgentHost", () => {
  it("is null when the sibling origin is unset so chrome can stay on SSE", () => {
    const previous = process.env.NEXT_PUBLIC_NICO_AGENT_URL;
    delete process.env.NEXT_PUBLIC_NICO_AGENT_URL;
    expect(nicoAgentHost()).toBeNull();
    if (previous === undefined) delete process.env.NEXT_PUBLIC_NICO_AGENT_URL;
    else process.env.NEXT_PUBLIC_NICO_AGENT_URL = previous;
  });

  it("uses an explicit origin so attach does not depend on NEXT_PUBLIC inlining", () => {
    const previous = process.env.NEXT_PUBLIC_NICO_AGENT_URL;
    delete process.env.NEXT_PUBLIC_NICO_AGENT_URL;
    expect(nicoAgentHost("http://127.0.0.1:8788/")).toBe("http://127.0.0.1:8788");
    expect(nicoAgentHostFromEnv()).toBeNull();
    if (previous === undefined) delete process.env.NEXT_PUBLIC_NICO_AGENT_URL;
    else process.env.NEXT_PUBLIC_NICO_AGENT_URL = previous;
  });
});

describe("issueHandshake", () => {
  it("returns null when AuthKit/session is missing so the UI does not crash", async () => {
    const fetchImpl = vi.fn().mockResolvedValue({ ok: false, status: 401 });
    await expect(issueHandshake("conv_1", fetchImpl)).resolves.toBeNull();
  });

  it("unwraps the JSON envelope", async () => {
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        ok: true,
        data: {
          token: "t.sig",
          profileId: "p1",
          conversationId: "c1",
        },
      }),
    });
    await expect(issueHandshake("c1", fetchImpl)).resolves.toEqual({
      token: "t.sig",
      profileId: "p1",
      conversationId: "c1",
    });
  });
});

describe("fetchAgentMessages", () => {
  it("returns [] when get-messages throws so useAgentChat does not crash", async () => {
    const fetchImpl = vi.fn().mockRejectedValue(new TypeError("Failed to fetch"));
    await expect(
      fetchAgentMessages(
        "http://127.0.0.1:8788/agents/nico-agent/p:c",
        "t.sig",
        fetchImpl,
      ),
    ).resolves.toEqual([]);
  });

  it("adds handshake to the get-messages URL and header", async () => {
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: true,
      text: async () => "[]",
    });
    await fetchAgentMessages(
      "http://127.0.0.1:8788/agents/nico-agent/p:c",
      "t.sig",
      fetchImpl,
    );
    const url = String(fetchImpl.mock.calls[0]?.[0]);
    expect(url).toContain("/get-messages");
    expect(url).toContain("handshake=t.sig");
    expect(fetchImpl.mock.calls[0]?.[1]).toEqual({
      headers: { "x-nico-handshake": "t.sig" },
    });
  });
});
