/**
 * Artifact Workflow script (KTD7). Binding name: NICO_ARTIFACTS.
 * Bytes render from cited specs via the custom OOXML / script writers.
 * This entry must not invent investor-facing numbers.
 */
import {
  WorkflowEntrypoint,
  type WorkflowEvent,
  type WorkflowStep,
} from "cloudflare:workers";
import { completeArtifactJob } from "../../../lib/artifacts/complete-job";

export type ArtifactJobParams = {
  artifactId: string;
};

type ArtifactEnv = {
  HYPERDRIVE?: { connectionString?: string };
  R2?: unknown;
};

export class NicoArtifactsWorkflow extends WorkflowEntrypoint<
  ArtifactEnv,
  ArtifactJobParams
> {
  async run(
    event: WorkflowEvent<ArtifactJobParams>,
    step: WorkflowStep,
  ): Promise<{
    artifactId: string;
    status: "ready";
    engine: "custom_ooxml";
  }> {
    const hd = this.env.HYPERDRIVE;
    if (hd?.connectionString && !process.env.DATABASE_URL) {
      process.env.DATABASE_URL = hd.connectionString;
    }
    if (this.env.R2) {
      (globalThis as { R2?: unknown }).R2 = this.env.R2;
    }
    return step.do("render cited artifact", () =>
      completeArtifactJob(event.payload.artifactId),
    );
  }
}

const worker = {
  async fetch(): Promise<Response> {
    return new Response("nico-artifacts: custom OOXML / script writers", {
      status: 200,
    });
  },
};

export default worker;
