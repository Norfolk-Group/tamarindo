import { afterEach, describe, expect, it, vi } from "vitest";
import { WatchProviderError } from "@/lib/research/exa";
import { runDueWatchTopics } from "@/lib/research/watch-loop";

describe("watch loop", () => {
  const previous = process.env.EXA_API_KEY;

  afterEach(() => {
    if (previous === undefined) delete process.env.EXA_API_KEY;
    else process.env.EXA_API_KEY = previous;
  });

  it("fails closed without a key and does not invent findings", async () => {
    delete process.env.EXA_API_KEY;
    await expect(
      runDueWatchTopics(Date.parse("2026-08-22T00:00:00Z")),
    ).rejects.toBeInstanceOf(WatchProviderError);
  });

  it("keeps source URLs and does not invent FEE_LINES", async () => {
    process.env.EXA_API_KEY = "exa_test";
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        results: [{ title: "Law", url: "https://example.com/law" }],
      }),
    });
    const results = await runDueWatchTopics(
      Date.parse("2026-08-22T00:00:00Z"),
      {},
      fetchImpl,
    );
    expect(results.length).toBeGreaterThan(0);
    expect(results.every((row) => row.findings.every((hit) => hit.url))).toBe(
      true,
    );
    expect(JSON.stringify(results).includes("FEE_LINES")).toBe(false);
  });
});
