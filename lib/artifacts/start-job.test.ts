import { describe, expect, it, vi } from "vitest";
import { startArtifactJob } from "@/lib/artifacts/start-job";

describe("startArtifactJob", () => {
  it("no-ops when the Workflow binding is absent", async () => {
    await expect(startArtifactJob("art_1")).resolves.toBe(false);
  });

  it("creates a Workflow instance when the binding exists", async () => {
    const create = vi.fn().mockResolvedValue({ id: "wf_1" });
    (globalThis as { NICO_ARTIFACTS?: { create: typeof create } }).NICO_ARTIFACTS = {
      create,
    };
    try {
      await expect(startArtifactJob("art_1")).resolves.toBe(true);
      expect(create).toHaveBeenCalledWith({ params: { artifactId: "art_1" } });
    } finally {
      delete (globalThis as { NICO_ARTIFACTS?: unknown }).NICO_ARTIFACTS;
    }
  });
});
