import { afterEach, describe, expect, it, vi } from "vitest";
import { WatchProviderError } from "@/lib/research/exa";
import { runWatchJob } from "@/lib/research/watch-job";

describe("runWatchJob", () => {
  const previous = process.env.EXA_API_KEY;

  afterEach(() => {
    if (previous === undefined) delete process.env.EXA_API_KEY;
    else process.env.EXA_API_KEY = previous;
  });

  it("fails closed without EXA_API_KEY and invents nothing", async () => {
    delete process.env.EXA_API_KEY;
    await expect(runWatchJob(Date.parse("2026-08-22T00:00:00Z"))).rejects.toBeInstanceOf(
      WatchProviderError,
    );
  });

  it("returns a dry-run log and does not persist", async () => {
    process.env.EXA_API_KEY = "exa_test";
    const fetchImpl = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        results: [{ title: "Law", url: "https://example.com/law" }],
      }),
    });
    const result = await runWatchJob(
      Date.parse("2026-08-22T00:00:00Z"),
      {},
      fetchImpl,
    );
    expect(result.persist).toBe(false);
    expect(result.provider).toBe("exa");
    expect(result.topics).toBeGreaterThan(0);
    expect(result.results.every((row) => row.findings.every((hit) => hit.url))).toBe(
      true,
    );
  });
});
