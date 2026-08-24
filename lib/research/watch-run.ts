/**
 * Sofia watch. Provider is Exa (Q9). Does not write Message.
 * Persist waits on an approved WatchHit migration (Q10).
 */
import { searchExa, WatchProviderError } from "@/lib/research/exa";
import { WATCH_TOPICS, topicsDue, type WatchTopic } from "@/lib/research/watch-topics";

export type WatchPlanItem = {
  id: string;
  queries: string[];
  provider: "exa";
};

export type WatchFinding = {
  topicId: string;
  title: string;
  url: string;
};

export function planWatchRun(
  nowMs = Date.now(),
  lastRunById: Record<string, number> = {},
): WatchPlanItem[] {
  return topicsDue(nowMs, lastRunById).map((topic: WatchTopic) => ({
    id: topic.id,
    queries: topic.queries,
    provider: "exa",
  }));
}

export function watchTopicCount(): number {
  return WATCH_TOPICS.length;
}

/**
 * Live step. Missing key fails closed and invents nothing.
 * Hits without a source URL are dropped (KTD15).
 */
export async function runWatchTopic(
  topic: WatchTopic,
  fetchImpl: typeof fetch = fetch,
): Promise<WatchFinding[]> {
  const findings: WatchFinding[] = [];
  for (const query of topic.queries) {
    const hits = await searchExa(query, fetchImpl);
    for (const hit of hits) {
      findings.push({ topicId: topic.id, title: hit.title, url: hit.url });
    }
  }
  return findings;
}

export { WatchProviderError };
