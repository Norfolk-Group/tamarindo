import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { registry } from "@/lib/procedures";
import { marketsGet } from "@/lib/procedures/markets";
import { clearWorldCache } from "@/lib/world/http";

const ctx = {
  actor: {
    kind: "user" as const,
    id: "guest-1",
    displayName: "Ada",
    role: "guest" as const,
  },
  traceId: "tape-test",
};

function yahooChart(price: number, prev: number, currency = "USD") {
  return {
    chart: {
      result: [
        {
          meta: {
            regularMarketPrice: price,
            chartPreviousClose: prev,
            currency,
          },
        },
      ],
    },
  };
}

describe("markets.get", () => {
  beforeEach(() => {
    clearWorldCache();
    vi.stubGlobal(
      "fetch",
      vi.fn(async (input: RequestInfo | URL) => {
        const url = String(input);
        if (url.includes("query1.finance.yahoo.com") && url.includes("%5EIXIC")) {
          return new Response(JSON.stringify(yahooChart(17812, 17880)), {
            status: 200,
          });
        }
        if (url.includes("query1.finance.yahoo.com")) {
          return new Response(JSON.stringify(yahooChart(100, 99)), {
            status: 200,
          });
        }
        if (url.includes("open.er-api.com")) {
          return new Response(
            JSON.stringify({ result: "success", rates: { COP: 4125.5 } }),
            { status: 200 },
          );
        }
        return new Response("missing", { status: 404 });
      }),
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("returns NASDAQ from Yahoo when asked for indices", async () => {
    const out = (await registry.invoke(
      "markets.get",
      { focus: "indices" },
      ctx,
    )) as Awaited<ReturnType<typeof marketsGet.handler>>;
    const nasdaq = out.quotes.find((q) => q.id === "nasdaq");
    expect(nasdaq?.last).toBe(17812);
    expect(nasdaq?.changePct).not.toBeNull();
  });
});
