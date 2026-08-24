/**
 * Watch Workflow body (KTD15 / U11). Dry-run only until a WatchHit
 * migration is approved (Q10). Never writes conversation Message.
 */
import {
  runDueWatchTopics,
  type WatchLoopResult,
} from "@/lib/research/watch-loop";

export type WatchJobResult = {
  persist: false;
  provider: "exa";
  topics: number;
  findings: number;
  results: WatchLoopResult[];
};

export async function runWatchJob(
  nowMs = Date.now(),
  lastRunById: Record<string, number> = {},
  fetchImpl: typeof fetch = fetch,
): Promise<WatchJobResult> {
  const results = await runDueWatchTopics(nowMs, lastRunById, fetchImpl);
  const findings = results.reduce((sum, row) => sum + row.findings.length, 0);
  console.info("[watch] dry-run", {
    persist: false,
    topics: results.length,
    findings,
  });
  return {
    persist: false,
    provider: "exa",
    topics: results.length,
    findings,
    results,
  };
}
