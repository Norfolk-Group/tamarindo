import { searchExa, WatchProviderError } from "@/lib/research/exa";

export type TickerItem = {
  title: string;
  url: string;
  source: string;
  kind: "live" | "cited";
};

/**
 * Colombia and Colombian real estate lead the feed; US credit is context and
 * InterVest is one beat, not the feed. `take` is that lane's slot count.
 */
const LANES: Array<{ query: string; take: number }> = [
  { query: "Colombia housing Medellín Cartagena foreign buyers 2026", take: 3 },
  { query: "Colombia leasing habitacional arriendo opción de compra regulación", take: 2 },
  { query: "Colombia real estate prices peso mortgage rates 2026", take: 2 },
  { query: "specialty finance warehouse leasing ABS private credit 2026", take: 2 },
  { query: "InterVest Capital Partners specialty finance news", take: 1 },
];

/** Public headlines we already fetched. Used when Exa is off so the bar is not empty. */
export const CITED_TICKER: TickerItem[] = [
  {
    title:
      "Medellín still the most resilient major housing market as the peso rally squeezes dollar buyers",
    url: "https://www.globalpropertyguide.com/latin-america/colombia/price-history",
    source: "Global Property Guide",
    kind: "cited",
  },
  {
    title:
      "Colombia 2026: apartments dominate; strongest rental demand in Laureles, Envigado, Chapinero",
    url: "https://thelatinvestor.com/blogs/news/colombia-real-estate-market",
    source: "TheLatinvestor",
    kind: "cited",
  },
  {
    title: "Why foreign buyers keep choosing Medellín over Bogotá and Cartagena",
    url: "https://nexo.legal/foreign-buyers-medellin-vs-other-colombian-cities-2026/",
    source: "Nexo Legal",
    kind: "cited",
  },
  {
    title:
      "No foreign-ownership quota in Medellín; peso mortgages run ~12–16% EA for foreigners",
    url: "https://thelatinvestor.com/blogs/news/medellin-foreigner",
    source: "TheLatinvestor",
    kind: "cited",
  },
  {
    title: "InterVest: 23 specialty-finance platforms, $21.3B+ annual originations",
    url: "https://intervest.com/specialty-finance/",
    source: "InterVest",
    kind: "cited",
  },
];

let cache: { at: number; items: TickerItem[] } | null = null;
const CACHE_MS = 15 * 60 * 1000;

function hostOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "source";
  }
}

export async function loadTickerItems(
  fetchImpl: typeof fetch = fetch,
  now = Date.now(),
): Promise<{ items: TickerItem[]; live: boolean; staleMs: number }> {
  if (cache && now - cache.at < CACHE_MS) {
    return {
      items: cache.items,
      live: cache.items.some((row) => row.kind === "live"),
      staleMs: now - cache.at,
    };
  }

  const perLane: TickerItem[][] = [];
  let usedLive = false;
  try {
    for (const lane of LANES) {
      const hits = await searchExa(lane.query, fetchImpl, {
        numResults: lane.take,
      });
      usedLive = true;
      perLane.push(
        hits.slice(0, lane.take).map((hit) => ({
          title: hit.title || hostOf(hit.url),
          url: hit.url,
          source: hostOf(hit.url),
          kind: "live" as const,
        })),
      );
    }
  } catch (err) {
    if (!(err instanceof WatchProviderError)) throw err;
  }

  // Round-robin across lanes so the bar opens Colombia-first but no lane
  // monopolizes consecutive slots.
  const live: TickerItem[] = [];
  const deepest = Math.max(0, ...perLane.map((lane) => lane.length));
  for (let i = 0; i < deepest; i += 1) {
    for (const lane of perLane) {
      if (lane[i]) live.push(lane[i]);
    }
  }

  const seen = new Set<string>();
  const items: TickerItem[] = [];
  for (const row of [...live, ...CITED_TICKER]) {
    if (seen.has(row.url)) continue;
    seen.add(row.url);
    items.push(row);
  }
  cache = { at: now, items };
  return { items, live: usedLive, staleMs: 0 };
}

export function resetTickerCache(): void {
  cache = null;
}
