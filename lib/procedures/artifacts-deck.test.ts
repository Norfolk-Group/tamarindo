import { describe, expect, it } from "vitest";
import { prisma } from "@/lib/db";
import { UnpublishedTermsError } from "@/lib/artifacts/deck";
import { teamSlideBullets } from "@/lib/nico/people";
import { registry } from "@/lib/procedures";
import { seed } from "../../prisma/seed";

const member = {
  actor: {
    kind: "user" as const,
    id: "dev-local",
    displayName: "Ricardo (dev)",
    role: "member" as const,
  },
  traceId: "artifact-deck-member",
};

const admin = {
  actor: {
    kind: "user" as const,
    id: "dev-local",
    displayName: "Ricardo (dev)",
    role: "admin" as const,
  },
  traceId: "artifact-deck-admin",
};

type DeckSlide = { id: string; title: string; bullets: string[] };
type DeckMeta = {
  spec?: { slides?: DeckSlide[] };
  variant?: string;
};

function askSlide(meta: DeckMeta | null | undefined): DeckSlide | undefined {
  return meta?.spec?.slides?.find((slide) => slide.id === "ask");
}

describe("artifacts.create deck variants", () => {
  it("refuses member raise when Deal Terms are unpublished (seed state)", async () => {
    await seed();
    const terms = await prisma.dealTerms.findUnique({ where: { version: 1 } });
    expect(terms?.status).toBe("draft");

    await expect(
      registry.invoke(
        "artifacts.create",
        { kind: "deck", title: "Investor deck", variant: "raise" },
        member,
      ),
    ).rejects.toBeInstanceOf(UnpublishedTermsError);
  });

  it("lets admin queue raise-draft without inventing a numeric ask", async () => {
    await seed();
    const result = (await registry.invoke(
      "artifacts.create",
      { kind: "deck", title: "Working raise deck", variant: "raise-draft" },
      admin,
    )) as { id: string; status: string };
    expect(result.status).toBe("queued");

    const row = await prisma.artifact.findUnique({ where: { id: result.id } });
    const metadata = row?.metadata as DeckMeta;
    expect(metadata.variant).toBe("raise-draft");

    const ask = askSlide(metadata);
    expect(ask).toBeDefined();
    const askText = (ask?.bullets ?? []).join(" ");
    expect(askText).toMatch(/not published|will not invent/i);
    expect(askText).not.toMatch(/\$[\d,]+/);
    expect(askText).not.toMatch(/\b\d(?:[\d,]*)\s*(?:million|m|k)\b/i);

    const team = metadata.spec?.slides?.find((slide) => slide.id === "team");
    expect(team?.bullets).toEqual(teamSlideBullets());
  });

  it("lets a member queue a structure deck without published terms", async () => {
    await seed();
    const result = (await registry.invoke(
      "artifacts.create",
      { kind: "deck", title: "Corporate structure", variant: "structure" },
      member,
    )) as { id: string; status: string };
    expect(result.status).toBe("queued");

    const row = await prisma.artifact.findUnique({ where: { id: result.id } });
    const metadata = row?.metadata as DeckMeta;
    expect(metadata.variant).toBe("structure");
    expect(askSlide(metadata)).toBeUndefined();
    expect(JSON.stringify(metadata.spec)).toMatch(/Tamarindo family/i);
  });

  it("does not let a member create raise-draft", async () => {
    await seed();
    await expect(
      registry.invoke(
        "artifacts.create",
        { kind: "deck", title: "Working raise", variant: "raise-draft" },
        member,
      ),
    ).rejects.toThrow(/admin only/i);
  });
});
