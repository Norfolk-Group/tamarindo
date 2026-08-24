import { afterEach, describe, expect, it } from "vitest";
import { WATCH_TOPICS } from "@/lib/research/watch-topics";
import {
  planWatchRun,
  runWatchTopic,
  WatchProviderError,
  watchTopicCount,
} from "@/lib/research/watch-run";

describe("watch dry-run", () => {
  const previous = process.env.EXA_API_KEY;

  afterEach(() => {
    if (previous === undefined) delete process.env.EXA_API_KEY;
    else process.env.EXA_API_KEY = previous;
  });

  it("plans due topics as Exa and does not invent findings", () => {
    const plan = planWatchRun(Date.parse("2026-08-22T00:00:00Z"), {});
    expect(plan.length).toBe(watchTopicCount());
    expect(plan.every((item) => item.provider === "exa")).toBe(true);
    expect(plan.every((item) => item.queries.length > 0)).toBe(true);
  });

  it("fails the live step with a named error when the Exa key is missing", async () => {
    delete process.env.EXA_API_KEY;
    const topic = WATCH_TOPICS[0];
    if (!topic) throw new Error("missing topic");
    await expect(runWatchTopic(topic)).rejects.toBeInstanceOf(WatchProviderError);
  });
});
