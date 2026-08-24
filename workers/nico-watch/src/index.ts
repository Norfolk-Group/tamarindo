/**
 * Sofia watch Workflow (KTD15). Binding name reserved: NICO_WATCH.
 * Does not write conversation Message. Persist waits on Q10.
 */
import {
  WorkflowEntrypoint,
  type WorkflowEvent,
  type WorkflowStep,
} from "cloudflare:workers";
import { runWatchJob } from "../../../lib/research/watch-job";

export type WatchJobParams = {
  lastRunById?: Record<string, number>;
};

export class NicoWatchWorkflow extends WorkflowEntrypoint<unknown, WatchJobParams> {
  async run(event: WorkflowEvent<WatchJobParams>, step: WorkflowStep) {
    return step.do("walk due topics", () =>
      runWatchJob(Date.now(), event.payload.lastRunById ?? {}),
    );
  }
}

const worker = {
  async fetch(): Promise<Response> {
    return new Response("nico-watch: Exa dry-run, no Message writes", {
      status: 200,
    });
  },
};

export default worker;
