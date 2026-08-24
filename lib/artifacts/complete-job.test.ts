import { describe, expect, it } from "vitest";
import { completeArtifactJob } from "@/lib/artifacts/complete-job";
import { prisma } from "@/lib/db";
import { registry } from "@/lib/procedures";
import { seed } from "../../prisma/seed";

const member = {
  actor: {
    kind: "user" as const,
    id: "dev-local",
    displayName: "Ricardo (dev)",
    role: "member" as const,
  },
  traceId: "artifact-complete",
};

describe("completeArtifactJob", () => {
  it("marks a queued workbook ready after the engines run", async () => {
    await seed();
    const created = (await registry.invoke(
      "artifacts.create",
      {
        kind: "excel",
        title: "US and Ashoka P&L",
        entities: ["Tamarindo US", "Ashoka"],
      },
      member,
    )) as { id: string };

    const result = await completeArtifactJob(created.id);
    expect(result.status).toBe("ready");
    expect(result.engine).toBe("custom_ooxml");

    const row = await prisma.artifact.findUnique({ where: { id: created.id } });
    const metadata = row?.metadata as { status?: string };
    expect(metadata.status).toBe("ready");
    expect(row?.storageRef).toBe("render:excel");
  });
});
