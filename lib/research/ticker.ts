import { searchExa, WatchProviderError } from "@/lib/research/exa";

export type TickerItem = {
  title: string;
  url: string;
  source: string;
  kind: "live" | "cited";
};

const QUERIES = [
  "InterVest Capital Partners specialty finance news",
  "Colombia housing Medellín Cartagena foreign buyers 2026",
  "specialty finance warehouse leasing ABS private credit 2026",
  "Colombia leasing habitacional regulación",
  "US Federal Reserve rates private credit specialty finance",
];

/** Public headlines we already fetched. Used when Exa is off so the bar is not empty. */
export const CITED_TICKER: TickerItem[] = [
  {
    title: "InterVest: 23 specialty-finance platforms, $21.3B+ annual originations",
    url: "https://intervest.com/specialty-finance/",
    source: "InterVest",
    kind: "cited",
  },
  {
    title: "InterVest affiliate acquires Kapitus (SMB specialty finance)",
    url: "https://www.prnewswire.com/news-releases/intervest-capital-partners-acquires-kapitus-302834859.html",
    source: "PR Newswire",
    kind: "cited",
  },
  {
    title: "Twain + InterVest JV to scale US bridge lending",
    url: "https://www.prnewswire.com/news-releases/twain-capital-partners-and-intervest-capital-partners-announce-joint-venture-partnership-to-scale-twains-bridge-lending-platform-302691729.html",
    source: "PR Newswire",
    kind: "cited",
  },
  {
    title: "InterVest: leased/rented physical assets and specialty-finance credit",
    url: "https://intervest.com/",
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

  const live: TickerItem[] = [];
  let usedLive = false;
  try {
    for (const query of QUERIES) {
      const hits = await searchExa(query, fetchImpl, { numResults: 3 });
      usedLive = true;
      for (const hit of hits) {
        live.push({
          title: hit.title || hostOf(hit.url),
          url: hit.url,
          source: hostOf(hit.url),
          kind: "live",
        });
      }
    }
  } catch (err) {
    if (!(err instanceof WatchProviderError)) throw err;
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
