import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const queryRaw = vi.hoisted(() => vi.fn());

vi.mock("@/lib/db", () => ({
  prisma: { $queryRaw: queryRaw },
}));

import { setCorpusForTests } from "@/lib/knowledge/corpus";
import { vectorPassages } from "@/lib/knowledge/vector-search";

const DIMS = 1024;
const EMBEDDING = Array.from({ length: DIMS }, () => 0.01);

const CORPUS = [
  {
    path: "knowledge/thesis/12-rate-benchmarks.md",
    title: "12 — Rate benchmarks",
    text: "Public rate research long enough to be a keyword block on its own line.",
    visibility: "public" as const,
  },
  {
    path: "docs/nico/08-guardrails.md",
    title: "08 — Guardrails",
    text: "Confidential guardrails long enough to be a keyword block on its own line.",
    visibility: "confidential" as const,
  },
];

const PUBLIC_CHUNK = {
  sourcePath: "knowledge/thesis/12-rate-benchmarks.md",
  title: "12 — Rate benchmarks",
  content: "Vehicle IRR lands near nine percent after the interest strip.",
  distance: 0.2,
};

const CONFIDENTIAL_CHUNK = {
  sourcePath: "docs/nico/08-guardrails.md",
  title: "08 — Guardrails",
  content: "Outbound sends always require an approval token.",
  distance: 0.1,
};

const UNKNOWN_CHUNK = {
  sourcePath: "knowledge/retired/99-deleted.md",
  title: "Retired note",
  content: "A chunk whose document is no longer in the bundled corpus.",
  distance: 0.05,
};

const savedAccount = process.env.CLOUDFLARE_ACCOUNT_ID;
const savedToken = process.env.CLOUDFLARE_API_TOKEN;

function setCredentials(account?: string, token?: string): void {
  if (account === undefined) delete process.env.CLOUDFLARE_ACCOUNT_ID;
  else process.env.CLOUDFLARE_ACCOUNT_ID = account;
  if (token === undefined) delete process.env.CLOUDFLARE_API_TOKEN;
  else process.env.CLOUDFLARE_API_TOKEN = token;
}

/** bge-m3 returns result.data; some model variants use result.response. */
function stubEmbedding(
  vectors: unknown = [EMBEDDING],
  key: "data" | "response" = "data",
): void {
  vi.stubGlobal(
    "fetch",
    vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ success: true, result: { [key]: vectors } }),
    }),
  );
}

function search(overrides: Partial<Parameters<typeof vectorPassages>[0]> = {}) {
  return vectorPassages({
    query: "what balloon percentage makes the lease a true lease",
    limit: 5,
    allowConfidential: false,
    ...overrides,
  });
}

beforeEach(() => {
  queryRaw.mockReset();
  queryRaw.mockResolvedValue([]);
  setCorpusForTests(CORPUS);
  setCredentials("acct_test", "token_test");
  vi.spyOn(console, "warn").mockImplementation(() => {});
});

afterEach(() => {
  setCorpusForTests(null);
  setCredentials(savedAccount, savedToken);
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("vector recall — silent degradation", () => {
  it("skips Workers AI entirely when the account id is unset", async () => {
    setCredentials(undefined, "token_test");
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    await expect(search()).resolves.toEqual([]);
    expect(fetchMock).not.toHaveBeenCalled();
    expect(queryRaw).not.toHaveBeenCalled();
  });

  it("treats an empty API token as no credentials", async () => {
    setCredentials("acct_test", "");
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    await expect(search()).resolves.toEqual([]);
    expect(fetchMock).not.toHaveBeenCalled();
    expect(console.warn).not.toHaveBeenCalled();
  });

  it("falls back when Workers AI rejects the token", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: false, status: 403 }),
    );
    await expect(search()).resolves.toEqual([]);
    expect(console.warn).toHaveBeenCalledTimes(1);
  });

  it("falls back when the embedding fetch rejects or times out", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new Error("The operation was aborted")),
    );
    await expect(search()).resolves.toEqual([]);
    expect(queryRaw).not.toHaveBeenCalled();
    expect(console.warn).toHaveBeenCalledTimes(1);
  });

  it("falls back when Workers AI reports success false", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        json: async () => ({ success: false, errors: [{ message: "nope" }] }),
      }),
    );
    await expect(search()).resolves.toEqual([]);
  });

  it("falls back when the embedding has the wrong dimensions", async () => {
    stubEmbedding([[0.1, 0.2, 0.3]]);
    await expect(search()).resolves.toEqual([]);
    expect(queryRaw).not.toHaveBeenCalled();
  });

  it("falls back when the database is unreachable", async () => {
    stubEmbedding();
    queryRaw.mockRejectedValue(new Error("DATABASE_URL is not set"));
    await expect(search()).resolves.toEqual([]);
    expect(console.warn).toHaveBeenCalledTimes(1);
  });

  it("returns nothing when no rows have embeddings yet", async () => {
    stubEmbedding();
    queryRaw.mockResolvedValue([]);
    await expect(search()).resolves.toEqual([]);
  });
});

describe("vector recall — query and scoring", () => {
  it("reads the result.response variant of the bge-m3 response", async () => {
    stubEmbedding([EMBEDDING], "response");
    queryRaw.mockResolvedValue([PUBLIC_CHUNK]);
    const passages = await search();
    expect(passages).toHaveLength(1);
    expect(passages[0]?.path).toBe("knowledge/thesis/12-rate-benchmarks.md");
  });

  it("binds the vector and the pool size as parameters, never as SQL text", async () => {
    stubEmbedding();
    queryRaw.mockResolvedValue([PUBLIC_CHUNK]);
    await search({ limit: 5 });

    const [strings, vectorParam, vectorParamAgain, poolSize] =
      queryRaw.mock.calls[0] as [readonly string[], string, string, number];
    const sql = strings.join("");
    expect(sql).toContain("<=>");
    expect(sql).not.toContain("0.01");
    expect(vectorParam).toBe(`[${EMBEDDING.join(",")}]`);
    expect(vectorParamAgain).toBe(vectorParam);
    // Over-fetch 3x the requested limit so the hybrid merge has material.
    expect(poolSize).toBe(15);
  });

  it("converts cosine distance to similarity and drops weak matches", async () => {
    stubEmbedding();
    queryRaw.mockResolvedValue([
      { ...PUBLIC_CHUNK, distance: 0.2 },
      { ...PUBLIC_CHUNK, content: "Barely related filler.", distance: 0.9 },
    ]);
    const passages = await search();
    expect(passages).toHaveLength(1);
    expect(passages[0]?.score).toBeCloseTo(0.8, 5);
  });

  it("tolerates a distance returned as a numeric string", async () => {
    stubEmbedding();
    queryRaw.mockResolvedValue([{ ...PUBLIC_CHUNK, distance: "0.25" }]);
    const passages = await search();
    expect(passages[0]?.score).toBeCloseTo(0.75, 5);
  });
});

describe("vector recall — confidential gate", () => {
  it("withholds a confidential chunk from an actor without access", async () => {
    stubEmbedding();
    queryRaw.mockResolvedValue([CONFIDENTIAL_CHUNK, PUBLIC_CHUNK]);
    const passages = await search({ allowConfidential: false });
    expect(passages.map((p) => p.path)).toEqual([
      "knowledge/thesis/12-rate-benchmarks.md",
    ]);
  });

  it("withholds a chunk whose sourcePath is unknown to the corpus", async () => {
    stubEmbedding();
    queryRaw.mockResolvedValue([UNKNOWN_CHUNK]);
    await expect(search({ allowConfidential: false })).resolves.toEqual([]);
  });

  it("withholds every chunk when the corpus is empty", async () => {
    setCorpusForTests([]);
    stubEmbedding();
    queryRaw.mockResolvedValue([PUBLIC_CHUNK, CONFIDENTIAL_CHUNK]);
    await expect(search({ allowConfidential: false })).resolves.toEqual([]);
  });

  it("releases confidential and unresolved chunks to a privileged actor", async () => {
    stubEmbedding();
    queryRaw.mockResolvedValue([
      CONFIDENTIAL_CHUNK,
      UNKNOWN_CHUNK,
      PUBLIC_CHUNK,
    ]);
    const passages = await search({ allowConfidential: true });
    expect(passages.map((p) => p.path)).toEqual([
      "docs/nico/08-guardrails.md",
      "knowledge/retired/99-deleted.md",
      "knowledge/thesis/12-rate-benchmarks.md",
    ]);
  });

  it("prefers the corpus title over the stored chunk title", async () => {
    stubEmbedding();
    queryRaw.mockResolvedValue([{ ...PUBLIC_CHUNK, title: "stale title" }]);
    const passages = await search();
    expect(passages[0]?.title).toBe("12 — Rate benchmarks");
  });
});
