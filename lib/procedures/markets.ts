import { z } from "zod";
import { defineProcedure } from "@/lib/procedures/registry";
import { cachedWorld, fetchJson, fetchText } from "@/lib/world/http";

const Focus = z.enum(["all", "indices", "fx", "coffee"]);

const Quote = z.object({
  id: z.string(),
  name: z.string(),
  last: z.number(),
  changePct: z.number().nullable(),
  unit: z.string(),
});

const Output = z.object({
  asOf: z.string(),
  quotes: z.array(Quote),
  source: z.string(),
});

type QuoteRow = z.infer<typeof Quote>;

type YahooChart = {
  chart?: {
    result?: Array<{
      meta?: {
        symbol?: string;
        shortName?: string;
        regularMarketPrice?: number;
        chartPreviousClose?: number;
        previousClose?: number;
        currency?: string;
      };
    }>;
  };
};

type ErApi = {
  result?: string;
  time_last_update_utc?: string;
  rates?: Record<string, number>;
};

const BASKET: Array<{
  id: string;
  name: string;
  yahoo: string;
  stooq?: string;
  unit: string;
  focus: Array<"indices" | "fx" | "coffee">;
}> = [
  {
    id: "nasdaq",
    name: "NASDAQ Composite",
    yahoo: "^IXIC",
    stooq: "^ndq",
    unit: "pts",
    focus: ["indices"],
  },
  {
    id: "spx",
    name: "S&P 500",
    yahoo: "^GSPC",
    stooq: "^spx",
    unit: "pts",
    focus: ["indices"],
  },
  {
    id: "us10y",
    name: "US 10Y yield",
    yahoo: "^TNX",
    unit: "%",
    focus: ["indices"],
  },
  {
    id: "usdcop",
    name: "USD/COP",
    yahoo: "COP=X",
    unit: "COP",
    focus: ["fx"],
  },
  {
    id: "coffee",
    name: "Arabica coffee",
    yahoo: "KC=F",
    stooq: "kc.f",
    unit: "USD/lb",
    focus: ["coffee"],
  },
];

export const marketsGet = defineProcedure({
  name: "markets.get",
  description:
    "Live market snapshot: NASDAQ, S&P 500, US 10Y, USD/COP, arabica coffee. Yahoo Finance with Stooq / ER-API fallbacks. No vendor key.",
  input: z.object({
    focus: Focus.default("all"),
  }),
  output: Output,
  minRole: "guest",
  requiresApproval: false,
  handler: async ({ focus }) => {
    return cachedWorld(`markets:${focus}`, 90_000, () => loadMarkets(focus));
  },
});

async function loadMarkets(
  focus: z.infer<typeof Focus>,
): Promise<z.infer<typeof Output>> {
  const wanted = BASKET.filter(
    (row) => focus === "all" || row.focus.includes(focus as "indices" | "fx" | "coffee"),
  );
  const quotes: QuoteRow[] = [];
  const sources = new Set<string>();

  for (const row of wanted) {
    const fromYahoo = await yahooQuote(row.yahoo, row.id, row.name, row.unit);
    if (fromYahoo) {
      quotes.push(fromYahoo);
      sources.add("Yahoo Finance");
      continue;
    }
    if (row.stooq) {
      const fromStooq = await stooqQuote(row.stooq, row.id, row.name, row.unit);
      if (fromStooq) {
        quotes.push(fromStooq);
        sources.add("Stooq");
        continue;
      }
    }
    if (row.id === "usdcop") {
      const fromEr = await copFromErApi();
      if (fromEr) {
        quotes.push(fromEr);
        sources.add("open.er-api.com");
      }
    }
  }

  if (quotes.length === 0) {
    throw new Error("Markets feeds did not return a quote.");
  }

  return {
    asOf: new Date().toISOString(),
    quotes,
    source: [...sources].join(" + "),
  };
}

async function yahooQuote(
  symbol: string,
  id: string,
  name: string,
  unit: string,
): Promise<QuoteRow | null> {
  try {
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=5d`;
    const data = await fetchJson<YahooChart>(url);
    const meta = data.chart?.result?.[0]?.meta;
    const last = meta?.regularMarketPrice;
    if (typeof last !== "number" || !Number.isFinite(last)) return null;
    const prev = meta?.chartPreviousClose ?? meta?.previousClose;
    const changePct =
      typeof prev === "number" && prev !== 0 ? ((last - prev) / prev) * 100 : null;
    return { id, name, last, changePct, unit: meta?.currency ?? unit };
  } catch {
    return null;
  }
}

async function stooqQuote(
  symbol: string,
  id: string,
  name: string,
  unit: string,
): Promise<QuoteRow | null> {
  try {
    const csv = await fetchText(
      `https://stooq.com/q/l/?s=${encodeURIComponent(symbol)}&f=sd2t2ohlcv&h&e=csv`,
    );
    const lines = csv.trim().split(/\r?\n/);
    const header = lines[0]?.toLowerCase() ?? "";
    const row = lines[1];
    if (!row || !header.includes("close")) return null;
    const cols = row.split(",");
    const closeIdx = header.split(",").findIndex((c) => c.trim() === "close");
    const last = Number(cols[closeIdx] ?? cols[6]);
    if (!Number.isFinite(last)) return null;
    return { id, name, last, changePct: null, unit };
  } catch {
    return null;
  }
}

async function copFromErApi(): Promise<QuoteRow | null> {
  try {
    const data = await fetchJson<ErApi>("https://open.er-api.com/v6/latest/USD");
    const cop = data.rates?.COP;
    if (typeof cop !== "number" || !Number.isFinite(cop)) return null;
    return {
      id: "usdcop",
      name: "USD/COP",
      last: cop,
      changePct: null,
      unit: "COP",
    };
  } catch {
    return null;
  }
}

export function formatMarketsNote(data: z.infer<typeof Output>): string {
  const bits = data.quotes.map((q) => {
    const last =
      q.unit === "%"
        ? `${q.last.toFixed(2)}%`
        : q.unit === "COP"
          ? q.last.toLocaleString("en-US", { maximumFractionDigits: 2 })
          : q.last.toLocaleString("en-US", { maximumFractionDigits: 2 });
    const ch =
      q.changePct == null
        ? ""
        : `, ${q.changePct >= 0 ? "+" : ""}${q.changePct.toFixed(2)}%`;
    return `${q.name} ${last}${q.unit === "%" || q.unit === "COP" ? "" : ` ${q.unit}`}${ch}`;
  });
  return `Markets (${data.source}): ${bits.join(". ")}.`;
}
