/**
 * Scheduled watch walker (KTD15). Does not write conversation Message.
 * Persist waits on an approved WatchHit migration (Q10).
 */
import { planWatchRun, runWatchTopic, type WatchFinding } from "@/lib/research/watch-run";
import { WATCH_TOPICS } from "@/lib/research/watch-topics";

export type WatchLoopResult = {
  topicId: string;
  findings: WatchFinding[];
};

export async function runDueWatchTopics(
  nowMs = Date.now(),
  lastRunById: Record<string, number> = {},
  fetchImpl: typeof fetch = fetch,
): Promise<WatchLoopResult[]> {
  const results: WatchLoopResult[] = [];
  for (const item of planWatchRun(nowMs, lastRunById)) {
    const topic = WATCH_TOPICS.find((row) => row.id === item.id);
    if (!topic) continue;
    results.push({
      topicId: item.id,
      findings: await runWatchTopic(topic, fetchImpl),
    });
  }
  return results;
}
