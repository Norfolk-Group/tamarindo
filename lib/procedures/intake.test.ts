import { afterEach, describe, expect, it } from "vitest";
import { prisma } from "@/lib/db";
import { setCurrentNdaForTests } from "@/lib/domain/access";
import { setCorpusForTests } from "@/lib/knowledge/corpus";
import { ndaTemplateHash } from "@/lib/nda/template";
import { registry } from "@/lib/procedures";
import { seed } from "../../prisma/seed";

const investorUser = {
  actor: {
    kind: "user" as const,
    id: "investor-intake",
    displayName: "LP One",
    role: "investor" as const,
  },
  traceId: "intake-user",
};

const investorAgent = {
  actor: { ...investorUser.actor, kind: "agent" as const },
  traceId: "intake-agent",
};

async function ensureInvestor(): Promise<void> {
  await prisma.profile.upsert({
    where: { authSubject: "investor-intake" },
    create: {
      authSubject: "investor-intake",
      displayName: "LP One",
      role: "investor",
    },
    update: { role: "investor", ndaSignedAt: null },
  });
  await prisma.ndaSignature.deleteMany({
    where: { profile: { authSubject: "investor-intake" } },
  });
  await prisma.consentRecord.deleteMany({
    where: { profile: { authSubject: "investor-intake" } },
  });
}

afterEach(() => {
  setCurrentNdaForTests(null);
  setCorpusForTests(null);
});

describe("intake and NDA", () => {
  it("lets a signed investor download a published file and see confidential passages (AE5 inverted)", async () => {
    await seed();
    await ensureInvestor();
    setCorpusForTests([
      {
        path: "knowledge/thesis/01-thesis.md",
        title: "Public",
        text: "Ashoka rental management is public thesis text that is long enough to score as a block.",
        visibility: "public",
      },
      {
        path: "docs/nico/08-guardrails.md",
        title: "Confidential",
        text: "Ashoka rental management confidential guardrail text that is long enough to score as a block.",
        visibility: "confidential",
      },
    ]);

    const unsigned = (await registry.invoke(
      "knowledge.search",
      { query: "Ashoka rental management", limit: 10 },
      investorUser,
    )) as { passages: { path: string }[] };
    expect(unsigned.passages.some((p) => p.path.startsWith("docs/nico/"))).toBe(false);

    const prepared = (await registry.invoke("nda.prepare", {}, investorUser)) as {
      documentHash: string;
    };
    await registry.invoke(
      "nda.sign",
      {
        typedName: "LP One",
        accepted: true,
        documentHash: prepared.documentHash,
        ipAddress: "127.0.0.1",
        userAgent: "vitest",
      },
      investorUser,
    );

    const signedSearch = (await registry.invoke(
      "knowledge.search",
      { query: "Ashoka rental management", limit: 10 },
      investorUser,
    )) as { passages: { path: string }[] };
    expect(signedSearch.passages.some((p) => p.path.startsWith("docs/nico/"))).toBe(true);

    const agentSearch = (await registry.invoke(
      "knowledge.search",
      { query: "Ashoka rental management", limit: 10 },
      investorAgent,
    )) as { passages: { path: string }[] };
    expect(agentSearch.passages.some((p) => p.path.startsWith("docs/nico/"))).toBe(true);

    const doc = await prisma.dataRoomDocument.create({
      data: {
        title: "Pilot memo",
        storageRef: "r2://tamarindo-files/pilot-memo.pdf",
        mimeType: "application/pdf",
        confidential: true,
        published: true,
      },
    });
    const download = (await registry.invoke(
      "dataroom.download",
      { documentId: doc.id },
      investorUser,
    )) as { storageRef: string };
    expect(download.storageRef).toContain("pilot-memo");
    const view = await prisma.dataRoomView.findFirst({
      where: { documentId: doc.id },
    });
    expect(view?.action).toBe("download");
  });

  it("keeps NDA after a bio edit and denies timestamp-only NDA", async () => {
    await seed();
    await ensureInvestor();
    await registry.invoke(
      "nda.sign",
      {
        typedName: "LP One",
        accepted: true,
        documentHash: ndaTemplateHash(),
        ipAddress: "127.0.0.1",
        userAgent: "vitest",
      },
      investorUser,
    );
    await registry.invoke(
      "profile.update",
      { bio: "Updated bio after NDA. Still long enough." },
      investorUser,
    );
    const profile = await prisma.profile.findUnique({
      where: { authSubject: "investor-intake" },
      include: { ndaSignatures: true },
    });
    expect(profile?.ndaSignedAt).not.toBeNull();
    expect(profile?.ndaSignatures.length).toBeGreaterThan(0);
    expect(profile?.bio).toContain("Updated bio");

    await prisma.profile.update({
      where: { authSubject: "investor-intake" },
      data: { ndaSignedAt: new Date() },
    });
    await prisma.ndaSignature.deleteMany({
      where: { profile: { authSubject: "investor-intake" } },
    });
    await expect(
      registry.invoke(
        "dataroom.download",
        { documentId: "missing" },
        investorUser,
      ),
    ).rejects.toThrow(/not found|NDA required/);

    const fake = await prisma.dataRoomDocument.create({
      data: {
        title: "Locked",
        storageRef: "r2://locked",
        mimeType: "application/pdf",
        confidential: true,
        published: true,
      },
    });
    await expect(
      registry.invoke("dataroom.download", { documentId: fake.id }, investorUser),
    ).rejects.toThrow(/NDA required/);
  });

  it("rejects agent nda.sign and unsigned dataroom download", async () => {
    await seed();
    await ensureInvestor();
    await expect(
      registry.invoke(
        "nda.sign",
        {
          typedName: "Nico",
          accepted: true,
          documentHash: ndaTemplateHash(),
          ipAddress: "127.0.0.1",
          userAgent: "vitest",
        },
        investorAgent,
      ),
    ).rejects.toMatchObject({ code: "forbidden" });

    const doc = await prisma.dataRoomDocument.create({
      data: {
        title: "Secret",
        storageRef: "r2://secret",
        mimeType: "application/pdf",
        confidential: true,
        published: true,
      },
    });
    await expect(
      registry.invoke("dataroom.download", { documentId: doc.id }, investorUser),
    ).rejects.toThrow(/NDA required/);
    await expect(
      registry.invoke("dataroom.download", { documentId: doc.id }, investorAgent),
    ).rejects.toThrow(/NDA required/);
  });

  it("lets an unsigned admin list and download confidential files, including drafts", async () => {
    await seed();
    setCurrentNdaForTests(false);
    const adminUser = {
      actor: {
        kind: "user" as const,
        id: "dev-local",
        displayName: "Ricardo (dev)",
        role: "admin" as const,
      },
      traceId: "admin-unsigned",
    };
    const draft = await prisma.dataRoomDocument.create({
      data: {
        title: "Admin draft",
        storageRef: "r2://admin-draft",
        mimeType: "application/pdf",
        confidential: true,
        published: false,
      },
    });
    const listed = (await registry.invoke("dataroom.list", {}, adminUser)) as {
      documents: { id: string; published: boolean }[];
    };
    expect(listed.documents.some((row) => row.id === draft.id && !row.published)).toBe(
      true,
    );
    const download = (await registry.invoke(
      "dataroom.download",
      { documentId: draft.id },
      adminUser,
    )) as { storageRef: string };
    expect(download.storageRef).toBe("r2://admin-draft");
    await expect(
      registry.invoke("dataroom.download", { documentId: draft.id }, investorUser),
    ).rejects.toThrow(/not found|NDA required/);
  });
});
