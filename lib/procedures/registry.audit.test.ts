import { describe, expect, it } from "vitest";
import { prisma } from "@/lib/db";
import { seed } from "../../prisma/seed";
import { registry } from "@/lib/procedures";

describe("seed and audit", () => {
  it("creates admin dev-local and draft Deal Terms version 1", async () => {
    await seed();
    const profile = await prisma.profile.findUnique({
      where: { authSubject: "dev-local" },
    });
    const terms = await prisma.dealTerms.findUnique({ where: { version: 1 } });
    expect(profile?.role).toBe("admin");
    expect(terms?.status).toBe("draft");
  });

  it("is idempotent on a second seed", async () => {
    await seed();
    await seed();
    const profiles = await prisma.profile.count({
      where: { authSubject: "dev-local" },
    });
    const terms = await prisma.dealTerms.count({ where: { version: 1 } });
    expect(profiles).toBe(1);
    expect(terms).toBe(1);
  });

  it("writes an AuditLog row for capabilities.list", async () => {
    await seed();
    const traceId = `test-audit-${Date.now()}`;
    await registry.invoke(
      "capabilities.list",
      {},
      {
        actor: {
          kind: "user",
          id: "dev-local",
          displayName: "Ricardo (dev)",
          role: "admin",
        },
        traceId,
      },
    );
    const row = await prisma.auditLog.findFirst({ where: { traceId } });
    expect(row?.procedure).toBe("capabilities.list");
    expect(row?.ok).toBe(true);
    expect(row?.actorKind).toBe("user");
  });
});
