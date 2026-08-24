import { describe, expect, it } from "vitest";
import { prisma } from "@/lib/db";
import { seed } from "../../prisma/seed";

describe("U1 seed", () => {
  it("creates the dev-local admin and draft Deal Terms, and is idempotent", async () => {
    await seed();
    await seed();
    const admins = await prisma.profile.findMany({
      where: { authSubject: "dev-local" },
    });
    const terms = await prisma.dealTerms.findMany({ where: { version: 1 } });
    expect(admins).toHaveLength(1);
    expect(admins[0]?.role).toBe("admin");
    expect(terms).toHaveLength(1);
    expect(terms[0]?.status).toBe("draft");
  });
});
