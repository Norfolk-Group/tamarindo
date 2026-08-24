import { describe, expect, it } from "vitest";
import { CITED_TICKER, loadTickerItems, resetTickerCache } from "@/lib/research/ticker";

describe("news ticker", () => {
  it("returns cited Intervest URLs when Exa is off", async () => {
    resetTickerCache();
    const previous = process.env.EXA_API_KEY;
    delete process.env.EXA_API_KEY;
    const result = await loadTickerItems();
    expect(result.live).toBe(false);
    expect(result.items.length).toBe(CITED_TICKER.length);
    expect(result.items.every((row) => row.url.startsWith("https://"))).toBe(true);
    if (previous === undefined) delete process.env.EXA_API_KEY;
    else process.env.EXA_API_KEY = previous;
  });
});
