import { afterEach, describe, expect, it, vi } from "vitest";
import { requireExaKey, searchExa, WatchProviderError } from "@/lib/research/exa";

describe("Exa watch client (Q9)", () => {
  const previous = process.env.EXA_API_KEY;

  afterEach(() => {
    if (previous === undefined) delete process.env.EXA_API_KEY;
    else process.env.EXA_API_KEY = previous;
  });

  it("fails closed without a key and does not invent findings", () => {
    delete process.env.EXA_API_KEY;
    expect(() => requireExaKey()).toThrow(WatchProviderError);
  });

  it("drops hits that have no source URL", async () => {
    process.env.EXA_API_KEY = "exa_test";
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        results: [
          { title: "Keep", url: "https://example.com/law" },
          { title: "Drop", url: "" },
        ],
      }),
    });
    const hits = await searchExa("Colombia leasing", fetchImpl);
    expect(hits).toEqual([{ title: "Keep", url: "https://example.com/law" }]);
  });
});
