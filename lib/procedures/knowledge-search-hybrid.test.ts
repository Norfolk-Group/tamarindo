import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const queryRaw = vi.hoisted(() => vi.fn());

vi.mock("@/lib/db", () => ({
  prisma: { $queryRaw: queryRaw },
}));

import { setCurrentNdaForTests } from "@/lib/domain/access";
import { setCorpusForTests } from "@/lib/knowledge/corpus";
import { knowledgeSearch } from "@/lib/procedures/knowledge-search";

const DIMS = 1024;
const EMBEDDING = Array.from({ length: DIMS }, () => 0.01);

const BALLOON_BLOCK =
  "The balloon is twenty percent of the asset so the contract stays a true lease rather than a loan.";
const IRR_BLOCK =
  "Intervest earns roughly nine percent IRR on a Poblado deal once the interest strip is applied.";

const CORPUS = [
  {
    path: "knowledge/thesis/12-rate-benchmarks.md",
    title: "12 — Rate benchmarks",
    text: `## Balloon policy\n\n${BALLOON_BLOCK}\n\n## Vehicle returns\n\n${IRR_BLOCK}`,
    visibility: "public" as const,
  },
  {
    path: "docs/nico/08-guardrails.md",
    title: "08 — Guardrails",
    text: "## Guardrails\n\nConfidential balloon guardrails for the orchestrator, long enough to score as a keyword block.",
    visibility: "confidential" as const,
  },
];

const investorCtx = {
  actor: {
    kind: "user" as const,
    id: "investor-hybrid",
    displayName: "LP",
    role: "investor" as const,
  },
  traceId: "test-hybrid",
};

const savedAccount = process.env.CLOUDFLARE_ACCOUNT_ID;
const savedToken = process.env.CLOUDFLARE_API_TOKEN;

function setCredentials(account?: string, token?: string): void {
  if (account === undefined) delete process.env.CLOUDFLARE_ACCOUNT_ID;
  else process.env.CLOUDFLARE_ACCOUNT_ID = account;
  if (token === undefined) delete process.env.CLOUDFLARE_API_TOKEN;
  else process.env.CLOUDFLARE_API_TOKEN = token;
}

function stubEmbedding(): void {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, result: { data: [EMBEDDING] } }),
    }),
  );
}

function chunk(sourcePath: string, content: string, distance: number) {
  return { sourcePath, title: "stored title", content, distance };
}

async function run(query: string, limit = 5) {
  return (await knowledgeSearch.handler({ query, limit }, investorCtx)) as {
    passages: { title: string; path: string; excerpt: string; score: number }[];
  };
}

beforeEach(() => {
  queryRaw.mockReset();
  queryRaw.mockResolvedValue([]);
  setCorpusForTests(CORPUS);
  setCurrentNdaForTests(false);
  setCredentials("acct_test", "token_test");
  vi.spyOn(console, "warn").mockImplementation(() => {});
});

afterEach(() => {
  setCorpusForTests(null);
  setCurrentNdaForTests(null);
  setCredentials(savedAccount, savedToken);
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("knowledge.search hybrid retrieval", () => {
  it("returns keyword-only results without throwing when credentials are missing", async () => {
    setCredentials(undefined, undefined);
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);

    const result = await run("balloon true lease");
    expect(result.passages.length).toBeGreaterThan(0);
    expect(result.passages[0]?.excerpt).toContain("balloon");
    expect(fetchMock).not.toHaveBeenCalled();
    expect(queryRaw).not.toHaveBeenCalled();
  });

  it("returns keyword-only results without throwing when the embedding call fails", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: false, status: 401 }),
    );

    const result = await run("balloon true lease");
    expect(result.passages.length).toBeGreaterThan(0);
    expect(result.passages[0]?.excerpt).toContain("balloon");
  });

  it("returns keyword-only results when the database is unreachable", async () => {
    stubEmbedding();
    queryRaw.mockRejectedValue(new Error("connection refused"));

    const result = await run("balloon true lease");
    expect(result.passages.some((p) => p.excerpt.includes("balloon"))).toBe(
      true,
    );
  });

  it("withholds a confidential vector hit from an unsigned investor", async () => {
    stubEmbedding();
    queryRaw.mockResolvedValue([
      chunk(
        "docs/nico/08-guardrails.md",
        "Confidential guardrail internals that must never reach an unsigned LP.",
        0.01,
      ),
      chunk("knowledge/retired/99-gone.md", "An untagged retired chunk.", 0.02),
    ]);

    const result = await run("balloon true lease");
    expect(result.passages.some((p) => p.path.startsWith("docs/nico/"))).toBe(
      false,
    );
    expect(
      result.passages.some((p) => p.path.startsWith("knowledge/retired/")),
    ).toBe(false);
    expect(
      result.passages.some((p) => /guardrail internals|retired chunk/i.test(p.excerpt)),
    ).toBe(false);
  });

  it("lets an admin see a confidential vector hit", async () => {
    stubEmbedding();
    queryRaw.mockResolvedValue([
      chunk(
        "docs/nico/08-guardrails.md",
        "Confidential guardrail internals reserved for admins.",
        0.05,
      ),
    ]);

    const result = (await knowledgeSearch.handler(
      { query: "balloon true lease", limit: 5 },
      {
        actor: {
          kind: "user" as const,
          id: "admin-hybrid",
          displayName: "Admin",
          role: "admin" as const,
        },
        traceId: "test-hybrid-admin",
      },
    )) as { passages: { path: string }[] };
    expect(result.passages.some((p) => p.path.startsWith("docs/nico/"))).toBe(
      true,
    );
  });

  it("merges a semantic-only passage in behind the top keyword hit", async () => {
    stubEmbedding();
    // A near-perfect vector match on a block the keyword query never mentions.
    queryRaw.mockResolvedValue([
      chunk("knowledge/thesis/12-rate-benchmarks.md", IRR_BLOCK, 0.02),
    ]);

    const result = await run("balloon true lease");
    expect(result.passages[0]?.excerpt).toContain("balloon");
    expect(result.passages.some((p) => p.excerpt === IRR_BLOCK)).toBe(true);
  });

  it("dedupes a vector chunk that repeats a keyword passage", async () => {
    stubEmbedding();
    queryRaw.mockResolvedValue([
      chunk("knowledge/thesis/12-rate-benchmarks.md", BALLOON_BLOCK, 0.01),
    ]);

    const result = await run("balloon true lease");
    const balloonHits = result.passages.filter((p) =>
      p.excerpt.startsWith("The balloon is twenty percent"),
    );
    expect(balloonHits).toHaveLength(1);
  });

  it("never returns more than the requested limit", async () => {
    stubEmbedding();
    queryRaw.mockResolvedValue([
      chunk("knowledge/thesis/12-rate-benchmarks.md", IRR_BLOCK, 0.02),
      chunk(
        "knowledge/thesis/12-rate-benchmarks.md",
        "Another distinct public block about vehicle economics.",
        0.03,
      ),
    ]);

    const result = await run("balloon true lease", 1);
    expect(result.passages).toHaveLength(1);
    expect(result.passages[0]?.excerpt).toContain("balloon");
  });

  it("still falls back to the thesis overview when neither path matches", async () => {
    stubEmbedding();
    queryRaw.mockResolvedValue([]);

    const result = await run("zzzzqqq", 3);
    expect(result.passages.length).toBeGreaterThan(0);
    expect(result.passages[0]?.path).toBe(
      "knowledge/thesis/12-rate-benchmarks.md",
    );
  });
});
