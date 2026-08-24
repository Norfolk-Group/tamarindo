import { describe, expect, it } from "vitest";
import { prisma } from "@/lib/db";
import { UnpublishedTermsError } from "@/lib/artifacts/deck";
import { renderArtifactBytes } from "@/lib/artifacts/render-bytes";
import { registry } from "@/lib/procedures";
import { seed } from "../../prisma/seed";

const member = {
  actor: {
    kind: "user" as const,
    id: "dev-local",
    displayName: "Ricardo (dev)",
    role: "member" as const,
  },
  traceId: "artifact-create",
};

describe("artifacts.create specs", () => {
  it("builds the whole family when entities are omitted", async () => {
    await seed();
    const result = (await registry.invoke(
      "artifacts.create",
      { kind: "excel", title: "Tamarindo family" },
      member,
    )) as { id: string };
    const row = await prisma.artifact.findUnique({ where: { id: result.id } });
    const metadata = row?.metadata as { spec?: { sheets?: { name: string }[] } };
    const names = metadata.spec?.sheets?.map((s) => s.name) ?? [];
    expect(names).toContain("Assumptions");
    expect(names).toContain("US P&L");
    expect(names).toContain("Intervest P&L");
    expect(names).toContain("Colombia P&L");
    expect(names).toContain("Ashoka P&L");
    expect(names).toContain("Family");
  });

  it("stores a 10-year workbook spec for named entities", async () => {
    await seed();
    const result = (await registry.invoke(
      "artifacts.create",
      {
        kind: "excel",
        title: "US and Ashoka P&L",
        entities: ["Tamarindo US", "Ashoka"],
      },
      member,
    )) as { id: string };
    const row = await prisma.artifact.findUnique({ where: { id: result.id } });
    const metadata = row?.metadata as { spec?: { sheets?: { name: string }[] } };
    const names = metadata.spec?.sheets?.map((s) => s.name) ?? [];
    expect(names).toContain("Assumptions");
    expect(names).toContain("US P&L");
    expect(names).toContain("Ashoka Fees");
    expect(row?.storageRef).toBe("render:excel");
    const file = renderArtifactBytes({
      kind: row?.kind ?? "excel",
      title: row?.title ?? "workbook",
      metadata: row?.metadata,
    });
    expect(file.filename.endsWith(".xlsx")).toBe(true);
    expect(file.bytes.subarray(0, 2).toString()).toBe("PK");
  });

  it("refuses a deck when Deal Terms are unpublished", async () => {
    await seed();
    await expect(
      registry.invoke(
        "artifacts.create",
        { kind: "deck", title: "Investor deck" },
        member,
      ),
    ).rejects.toBeInstanceOf(UnpublishedTermsError);
  });
});
