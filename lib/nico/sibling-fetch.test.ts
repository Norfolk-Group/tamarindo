import { afterEach, describe, expect, it, vi } from "vitest";
import { fetchSiblingAgent } from "@/lib/nico/sibling-fetch";

describe("fetchSiblingAgent", () => {
  const previous = process.env.NICO_AGENT_URL;

  afterEach(() => {
    if (previous === undefined) delete process.env.NICO_AGENT_URL;
    else process.env.NICO_AGENT_URL = previous;
    delete (globalThis as { NICO_AGENT?: unknown }).NICO_AGENT;
    vi.unstubAllGlobals();
  });

  it("returns null when neither binding nor URL is set", async () => {
    delete process.env.NICO_AGENT_URL;
    await expect(fetchSiblingAgent("/turn", { method: "POST" })).resolves.toBeNull();
  });

  it("prefers the service binding over NICO_AGENT_URL (Q7)", async () => {
    process.env.NICO_AGENT_URL = "https://nico-agent.example";
    const bindingFetch = vi.fn().mockResolvedValue(new Response("ok"));
    const urlFetch = vi.fn();
    (globalThis as { NICO_AGENT?: { fetch: typeof bindingFetch } }).NICO_AGENT = {
      fetch: bindingFetch,
    };
    vi.stubGlobal("fetch", urlFetch);
    const res = await fetchSiblingAgent("/resume", { method: "POST" });
    expect(res?.ok).toBe(true);
    expect(bindingFetch).toHaveBeenCalled();
    expect(urlFetch).not.toHaveBeenCalled();
  });
});
