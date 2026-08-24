import { z } from "zod";
import { defineProcedure } from "@/lib/procedures/registry";
import { cachedWorld, fetchText } from "@/lib/world/http";

const Window = z.enum(["hour", "day"]);
const Region = z.enum([
  "world",
  "us",
  "colombia",
  "medellin_re",
  "cartagena_re",
]);

const Item = z.object({
  title: z.string(),
  url: z.string(),
  source: z.string(),
  publishedAt: z.string().nullable(),
});

const Output = z.object({
  window: Window,
  region: Region,
  asOf: z.string(),
  items: z.array(Item),
  source: z.string(),
});

type Headline = z.infer<typeof Item>;
type RegionId = z.infer<typeof Region>;

const REGION_LABEL: Record<RegionId, string> = {
  world: "world",
  us: "US",
  colombia: "Colombia",
  medellin_re: "Medellín greater area real estate",
  cartagena_re: "Cartagena walled city real estate",
};

function googleNewsSearch(query: string, locale: "co" | "en"): string {
  const params =
    locale === "co"
      ? "hl=es-419&gl=CO&ceid=CO:es"
      : "hl=en-US&gl=US&ceid=US:en";
  return `https://news.google.com/rss/search?q=${encodeURIComponent(query)}&${params}`;
}

const FEEDS: Record<RegionId, Array<{ name: string; url: string }>> = {
  world: [
    { name: "BBC World", url: "https://feeds.bbci.co.uk/news/world/rss.xml" },
    {
      name: "Google News",
      url: "https://news.google.com/rss?hl=en-US&gl=US&ceid=US:en",
    },
  ],
  us: [
    { name: "NPR", url: "https://feeds.npr.org/1001/rss.xml" },
    {
      name: "Google News US",
      url: "https://news.google.com/rss?hl=en-US&gl=US&ceid=US:en",
    },
  ],
  colombia: [
    {
      name: "Google News Colombia",
      url: "https://news.google.com/rss?hl=es-419&gl=CO&ceid=CO:es",
    },
    { name: "BBC Mundo", url: "https://feeds.bbci.co.uk/mundo/rss.xml" },
  ],
  medellin_re: [
    {
      name: "Google News (Aburrá housing, ES)",
      url: googleNewsSearch(
        '("Medellín" OR "Valle de Aburrá" OR "El Poblado" OR Envigado OR Sabaneta OR Llanogrande OR Rionegro) (inmobiliario OR vivienda OR "finca raíz" OR arriendo OR apartamento)',
        "co",
      ),
    },
    {
      name: "Google News (Aburrá housing, EN)",
      url: googleNewsSearch(
        '(Medellin OR "Aburra Valley" OR Poblado OR Envigado OR Llanogrande) ("real estate" OR housing OR apartment OR rental)',
        "en",
      ),
    },
  ],
  cartagena_re: [
    {
      name: "Google News (walled city housing, ES)",
      url: googleNewsSearch(
        '(Cartagena AND ("ciudad amurallada" OR "Centro Histórico" OR Getsemaní OR "San Diego" OR Bocagrande)) (inmobiliario OR vivienda OR "finca raíz" OR arriendo)',
        "co",
      ),
    },
    {
      name: "Google News (walled city housing, EN)",
      url: googleNewsSearch(
        '(Cartagena AND ("walled city" OR "old city" OR Getsemani OR Bocagrande)) ("real estate" OR housing OR apartment)',
        "en",
      ),
    },
  ],
};

export const newsHeadlines = defineProcedure({
  name: "news.headlines",
  description:
    "Top headlines for the day or the last hour. World, US, Colombia, plus Medellín greater-area and Cartagena walled-city real estate. Google News / BBC / NPR RSS. No vendor key.",
  input: z.object({
    window: Window.default("day"),
    region: Region.default("world"),
    limit: z.number().int().min(3).max(8).default(5),
  }),
  output: Output,
  minRole: "guest",
  requiresApproval: false,
  handler: async ({ window, region, limit }) => {
    return cachedWorld(
      `news:${window}:${region}:${limit}`,
      window === "hour" ? 5 * 60_000 : 10 * 60_000,
      () => loadHeadlines(window, region, limit),
    );
  },
});

async function loadHeadlines(
  window: z.infer<typeof Window>,
  region: z.infer<typeof Region>,
  limit: number,
): Promise<z.infer<typeof Output>> {
  const feeds = FEEDS[region];
  const collected: Headline[] = [];
  const used: string[] = [];

  for (const feed of feeds) {
    try {
      const xml = await fetchText(feed.url, 9000);
      const items = parseRss(xml, feed.name);
      if (items.length > 0) used.push(feed.name);
      collected.push(...items);
    } catch {
      // try the next feed
    }
  }

  const unique = dedupe(collected);
  unique.sort((a, b) => (b.publishedAt ?? "").localeCompare(a.publishedAt ?? ""));

  const cutoff = Date.now() - (window === "hour" ? 90 * 60_000 : 36 * 60 * 60_000);
  const fresh = unique.filter((item) => {
    if (!item.publishedAt) return window === "day";
    const t = Date.parse(item.publishedAt);
    return Number.isFinite(t) && t >= cutoff;
  });
  const items = (fresh.length >= 3 ? fresh : unique).slice(0, limit);
  if (items.length === 0) {
    throw new Error("Headline feeds came back empty.");
  }

  return {
    window,
    region,
    asOf: new Date().toISOString(),
    items,
    source: used.join(" + ") || "RSS",
  };
}

function parseRss(xml: string, fallbackSource: string): Headline[] {
  const blocks = xml.match(/<item\b[\s\S]*?<\/item>/gi) ?? [];
  const items: Headline[] = [];
  for (const block of blocks) {
    const title = decodeXml(inner(block, "title"));
    const url = inner(block, "link") || inner(block, "guid");
    if (!title || !url) continue;
    const source =
      decodeXml(inner(block, "source")) ||
      decodeXml(attr(block, "source", "url") ? fallbackSource : "") ||
      fallbackSource;
    const publishedAt = inner(block, "pubDate") || inner(block, "updated") || null;
    items.push({
      title: title.replace(/\s+-\s+[^-]+$/, "").trim(),
      url: url.trim(),
      source: source || fallbackSource,
      publishedAt,
    });
  }
  return items;
}

function inner(xml: string, tag: string): string {
  const cdata = xml.match(
    new RegExp(`<${tag}[^>]*>\\s*<!\\[CDATA\\[([\\s\\S]*?)\\]\\]>\\s*</${tag}>`, "i"),
  );
  if (cdata?.[1]) return cdata[1].trim();
  const plain = xml.match(new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, "i"));
  return plain?.[1]?.trim() ?? "";
}

function attr(xml: string, tag: string, name: string): string {
  const match = xml.match(new RegExp(`<${tag}[^>]*\\b${name}="([^"]+)"`, "i"));
  return match?.[1] ?? "";
}

function decodeXml(value: string): string {
  return value
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#(\d+);/g, (_, n: string) => String.fromCharCode(Number(n)))
    .trim();
}

function dedupe(items: Headline[]): Headline[] {
  const seen = new Set<string>();
  const out: Headline[] = [];
  for (const item of items) {
    const key = item.title.toLowerCase().slice(0, 80);
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(item);
  }
  return out;
}

export function formatNewsNote(data: z.infer<typeof Output>): string {
  const when = data.window === "hour" ? "last ~hour" : "today";
  const where = REGION_LABEL[data.region];
  const lines = data.items.map((item, i) => `${i + 1}. ${item.title} (${item.source})`);
  return `Headlines (${when}, ${where}, ${data.source}): ${lines.join(" ")}`;
}
