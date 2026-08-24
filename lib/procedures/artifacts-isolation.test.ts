import { describe, expect, it } from "vitest";
import { prisma } from "@/lib/db";
import { registry } from "@/lib/procedures";
import { seed } from "../../prisma/seed";

const memberA = {
  actor: {
    kind: "user" as const,
    id: "member-art-a",
    displayName: "Ada",
    role: "member" as const,
  },
  traceId: "art-a",
};

const memberB = {
  actor: {
    kind: "user" as const,
    id: "member-art-b",
    displayName: "Bea",
    role: "member" as const,
  },
  traceId: "art-b",
};

async function ensureMember(subject: string, name: string): Promise<void> {
  await prisma.profile.upsert({
    where: { authSubject: subject },
    create: { authSubject: subject, displayName: name, role: "member" },
    update: { role: "member" },
  });
}

describe("artifact visibility", () => {
  it("does not let member B list or get member A's workbook", async () => {
    await seed();
    await ensureMember("member-art-a", "Ada");
    await ensureMember("member-art-b", "Bea");
    const created = (await registry.invoke(
      "artifacts.create",
      {
        kind: "excel",
        title: "Ada only",
        entities: ["Tamarindo Intervest"],
      },
      memberA,
    )) as { id: string };

    const listed = (await registry.invoke("artifacts.list", {}, memberB)) as {
      artifacts: { id: string }[];
    };
    expect(listed.artifacts.some((row) => row.id === created.id)).toBe(false);

    await expect(
      registry.invoke("artifacts.get", { id: created.id }, memberB),
    ).rejects.toThrow(/not found/i);
  });

  it("renders a podcast script from a memo and does not invent a raise number", async () => {
    await seed();
    await ensureMember("member-art-a", "Ada");
    const created = (await registry.invoke(
      "artifacts.create",
      {
        kind: "podcast",
        title: "Pilot memo",
        memo: {
          title: "Pilot memo",
          body: "The rental pool is live on three homes. No ask is stated here.",
        },
      },
      memberA,
    )) as { id: string };
    const row = await prisma.artifact.findUnique({ where: { id: created.id } });
    expect(JSON.stringify(row?.metadata).includes("2.5")).toBe(false);
    expect(row?.storageRef).toBe("render:podcast");
  });
});
