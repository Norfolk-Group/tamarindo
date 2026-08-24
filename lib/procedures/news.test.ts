import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { registry } from "@/lib/procedures";
import { newsHeadlines } from "@/lib/procedures/news";
import { clearWorldCache } from "@/lib/world/http";

const ctx = {
  actor: {
    kind: "user" as const,
    id: "guest-1",
    displayName: "Ada",
    role: "guest" as const,
  },
  traceId: "news-test",
};

const RSS = `<?xml version="1.0"?>
<rss><channel>
<item>
  <title>A labeled number beats a rumor</title>
  <link>https://example.com/one</link>
  <pubDate>Sun, 23 Aug 2026 16:40:00 GMT</pubDate>
  <source>BBC World</source>
</item>
<item>
  <title>Coffee holds while the peso fidgets</title>
  <link>https://example.com/two</link>
  <pubDate>Sun, 23 Aug 2026 16:10:00 GMT</pubDate>
  <source>Reuters</source>
</item>
<item>
  <title>A third headline so the hour window still has a floor</title>
  <link>https://example.com/three</link>
  <pubDate>Sun, 23 Aug 2026 15:55:00 GMT</pubDate>
  <source>NPR</source>
</item>
</channel></rss>`;

describe("news.headlines", () => {
  beforeEach(() => {
    clearWorldCache();
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-08-23T17:00:00.000Z"));
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => new Response(RSS, { status: 200 })),
    );
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("parses RSS titles for the hour window", async () => {
    const out = (await registry.invoke(
      "news.headlines",
      { window: "hour", region: "world", limit: 5 },
      ctx,
    )) as Awaited<ReturnType<typeof newsHeadlines.handler>>;
    expect(out.items.length).toBeGreaterThanOrEqual(3);
    expect(out.items[0]?.title).toMatch(/labeled number/i);
  });

  it("hits Google News search for Aburrá and walled-city housing", async () => {
    await registry.invoke(
      "news.headlines",
      { window: "day", region: "medellin_re", limit: 5 },
      ctx,
    );
    await registry.invoke(
      "news.headlines",
      { window: "day", region: "cartagena_re", limit: 5 },
      ctx,
    );
    const urls = vi
      .mocked(fetch)
      .mock.calls.map((call) => decodeURIComponent(String(call[0])));
    expect(
      urls.some(
        (url) =>
          url.includes("news.google.com/rss/search") &&
          url.includes("Medellín") &&
          url.includes("inmobiliario"),
      ),
    ).toBe(true);
    expect(
      urls.some(
        (url) =>
          url.includes("news.google.com/rss/search") &&
          url.includes("ciudad amurallada") &&
          url.includes("Cartagena"),
      ),
    ).toBe(true);
  });
});
