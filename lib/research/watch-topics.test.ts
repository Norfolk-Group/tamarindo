import { describe, expect, it } from "vitest";
import { WATCH_TOPICS, topicsDue } from "@/lib/research/watch-topics";

describe("watch topics", () => {
  it("covers Colombia regulation and ecosystem news", () => {
    const ids = WATCH_TOPICS.map((t) => t.id);
    expect(ids).toContain("co.lease_vs_credit");
    expect(ids).toContain("eco.specialty_finance");
    expect(WATCH_TOPICS.every((t) => t.queries.length > 0)).toBe(true);
    expect(WATCH_TOPICS.every((t) => t.citation.path.length > 0)).toBe(true);
  });

  it("returns every topic when nothing has run", () => {
    expect(topicsDue(Date.now(), {}).length).toBe(WATCH_TOPICS.length);
  });

  it("skips a topic still inside its cadence", () => {
    const now = Date.parse("2026-08-22T06:00:00Z");
    const lastRunById = Object.fromEntries(
      WATCH_TOPICS.map((t) => [t.id, now - 60 * 60 * 1000]),
    );
    expect(topicsDue(now, lastRunById)).toEqual([]);
  });
});
