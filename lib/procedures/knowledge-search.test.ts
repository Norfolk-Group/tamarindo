import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { setCurrentNdaForTests } from "@/lib/domain/access";
import { setCorpusForTests } from "@/lib/knowledge/corpus";
import { registry } from "@/lib/procedures";
import { knowledgeSearch } from "@/lib/procedures/knowledge-search";

const investorCtx = {
  actor: {
    kind: "user" as const,
    id: "dev-local",
    displayName: "Ricardo (dev)",
    role: "investor" as const,
  },
  traceId: "test-knowledge",
};

beforeEach(() => {
  setCurrentNdaForTests(false);
});

afterEach(() => {
  setCorpusForTests(null);
  setCurrentNdaForTests(null);
});

describe("knowledge.search", () => {
  it("returns thesis passages without reading the filesystem at request time", async () => {
    const result = (await knowledgeSearch.handler(
      { query: "Ashoka rental management", limit: 5 },
      investorCtx,
    )) as { passages: { path: string; excerpt: string }[] };
    expect(result.passages.length).toBeGreaterThan(0);
    expect(result.passages.some((p) => p.path.includes("knowledge/thesis"))).toBe(
      true,
    );
    expect(result.passages.some((p) => p.path.startsWith("docs/nico/"))).toBe(
      false,
    );
  });

  it("returns zero passages for an empty corpus", async () => {
    setCorpusForTests([]);
    const result = (await knowledgeSearch.handler(
      { query: "Ashoka rental management", limit: 5 },
      investorCtx,
    )) as { passages: unknown[] };
    expect(result.passages).toEqual([]);
  });

  it("stays on the capability map under the same name", () => {
    const names = registry
      .capabilities({ role: "investor", kind: "user" })
      .map((c) => c.name);
    expect(names).toContain("knowledge.search");
  });

  it("ranks the ICP thesis over Nico build docs", async () => {
    setCurrentNdaForTests(true);
    const result = (await knowledgeSearch.handler(
      { query: "what is an ICP?", limit: 4 },
      investorCtx,
    )) as { passages: { path: string }[] };
    expect(result.passages.length).toBeGreaterThan(0);
    expect(result.passages[0]?.path).toBe("knowledge/thesis/04-icp-deals.md");
    expect(result.passages.some((p) => p.path.startsWith("docs/nico/"))).toBe(
      false,
    );
  });

  it("retrieves persona Q&A on Intervest capital", async () => {
    const result = (await knowledgeSearch.handler(
      { query: "How much capital did Intervest actually commit?", limit: 5 },
      investorCtx,
    )) as { passages: { path: string; excerpt: string }[] };
    expect(result.passages.some((p) => p.path.includes("knowledge/qa"))).toBe(
      true,
    );
    expect(
      result.passages.some((p) => /20|twenty|10 million/i.test(p.excerpt)),
    ).toBe(true);
  });

  it("returns the thesis overview when nothing matches", async () => {
    const result = (await knowledgeSearch.handler(
      { query: "hello", limit: 3 },
      investorCtx,
    )) as { passages: { path: string }[] };
    expect(result.passages.length).toBeGreaterThan(0);
    expect(result.passages[0]?.path).toBe("knowledge/thesis/01-thesis.md");
  });

  it("returns only public passages for an unsigned investor (AE5)", async () => {
    setCurrentNdaForTests(false);
    setCorpusForTests([
      {
        path: "knowledge/thesis/01-thesis.md",
        title: "Public thesis",
        text: "Ashoka rental management is the service layer for the pool.\n\nMore public text so the block is long enough to score.",
        visibility: "public",
      },
      {
        path: "docs/nico/08-guardrails.md",
        title: "Confidential guardrails",
        text: "Ashoka rental management internals and data-room rules stay confidential.\n\nMore confidential text so the block is long enough to score.",
        visibility: "confidential",
      },
    ]);
    const unsigned = {
      actor: {
        kind: "user" as const,
        id: "investor-unsigned",
        displayName: "LP",
        role: "investor" as const,
      },
      traceId: "test-nda-user",
    };
    const agent = {
      actor: { ...unsigned.actor, kind: "agent" as const },
      traceId: "test-nda-agent",
    };
    for (const ctx of [unsigned, agent]) {
      const result = (await knowledgeSearch.handler(
        { query: "Ashoka rental management", limit: 10 },
        ctx,
      )) as { passages: { path: string }[] };
      expect(result.passages.every((p) => p.path.includes("knowledge/thesis"))).toBe(
        true,
      );
      expect(result.passages.some((p) => p.path.startsWith("docs/nico/"))).toBe(
        false,
      );
    }
  });

  it("lets an unsigned admin see confidential passages", async () => {
    setCurrentNdaForTests(false);
    setCorpusForTests([
      {
        path: "knowledge/thesis/01-thesis.md",
        title: "Public thesis",
        text: "Ashoka rental management is the service layer for the pool.\n\nMore public text so the block is long enough to score.",
        visibility: "public",
      },
      {
        path: "docs/nico/08-guardrails.md",
        title: "Confidential guardrails",
        text: "Ashoka rental management confidential guardrail text that is long enough to score as a block.",
        visibility: "confidential",
      },
    ]);
    const result = (await knowledgeSearch.handler(
      { query: "Ashoka rental management", limit: 10 },
      {
        actor: {
          kind: "user",
          id: "admin-unsigned",
          displayName: "Admin",
          role: "admin",
        },
        traceId: "test-admin-nda",
      },
    )) as { passages: { path: string }[] };
    expect(result.passages.some((p) => p.path.startsWith("docs/nico/"))).toBe(true);
  });
});
