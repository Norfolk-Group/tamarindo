import { prisma } from "@/lib/db";
import { getCorpus, type CorpusDocument } from "@/lib/knowledge/corpus";

/**
 * Semantic recall over MemoryChunk (pgvector, 1024-dim @cf/baai/bge-m3),
 * the companion to the keyword path in lib/procedures/knowledge-search.ts.
 *
 * MemoryChunk has no visibility column — only sourcePath — so every hit is
 * re-gated against the bundled corpus before it leaves this module. A chunk
 * that does not resolve to a known document is treated as confidential,
 * matching the corpus rule that untagged documents are confidential.
 */

const EMBEDDING_MODEL = "@cf/baai/bge-m3";
const EXPECTED_DIMS = 1024;
const EMBED_TIMEOUT_MS = 4_000;
/** Mirrors the keyword path so identical blocks dedupe cleanly. */
const EXCERPT_LIMIT = 900;
/** Over-fetch so the hybrid merge has material to interleave and dedupe. */
const CANDIDATE_MULTIPLIER = 3;
/**
 * bge-m3 is not zero-centred: unrelated text still lands near 0.3–0.5
 * cosine similarity. Drop anything below this so weak recall cannot pad
 * the result set when the keyword path returned fewer than `limit` hits.
 */
const MIN_SIMILARITY = 0.35;

export type VectorPassage = {
  title: string;
  path: string;
  excerpt: string;
  score: number;
};

export type VectorSearchArgs = {
  query: string;
  limit: number;
  /** Result of canReadConfidential for the calling actor. */
  allowConfidential: boolean;
};

type ChunkRow = {
  sourcePath: string;
  title: string;
  content: string;
  distance: number | string;
};

type EmbedResponse = {
  success?: boolean;
  errors?: unknown;
  result?: { data?: unknown; response?: unknown };
};

/**
 * Never throws. Semantic recall is an enhancement on top of keyword search:
 * absent credentials, a failed or slow Workers AI call, an unreachable
 * database, or a table with no embeddings must all leave the keyword
 * results untouched rather than surface an error to the caller.
 */
export async function vectorPassages(
  args: VectorSearchArgs,
): Promise<VectorPassage[]> {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID;
  const apiToken = process.env.CLOUDFLARE_API_TOKEN;
  // Unset or blank credentials are the normal state in local dev and CI,
  // not a fault worth logging on every search.
  if (!accountId || !apiToken) return [];

  try {
    const embedding = await embedQuery(args.query, accountId, apiToken);
    const rows = await nearestChunks(
      embedding,
      args.limit * CANDIDATE_MULTIPLIER,
    );
    return visiblePassages(rows, args.allowConfidential);
  } catch (err) {
    console.warn("[knowledge] vector recall skipped", err);
    return [];
  }
}

async function embedQuery(
  query: string,
  accountId: string,
  apiToken: string,
): Promise<number[]> {
  const res = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/${EMBEDDING_MODEL}`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ text: [query] }),
      signal: AbortSignal.timeout(EMBED_TIMEOUT_MS),
    },
  );
  if (!res.ok) {
    throw new Error(`Workers AI HTTP ${res.status}`);
  }
  const json = (await res.json()) as EmbedResponse;
  if (json.success === false) {
    throw new Error(`Workers AI error: ${JSON.stringify(json.errors)}`);
  }
  // The bge-m3 REST response is {result:{data:[[...]]}}; some model variants
  // use result.response instead.
  const vectors: unknown = json.result?.data ?? json.result?.response;
  const first: unknown = Array.isArray(vectors) ? vectors[0] : undefined;
  if (!Array.isArray(first) || first.length !== EXPECTED_DIMS) {
    throw new Error(
      `Unexpected embedding shape: ${
        Array.isArray(first) ? `${first.length} dims` : typeof first
      }`,
    );
  }
  const embedding = first.map((value) => Number(value));
  if (embedding.some((value) => !Number.isFinite(value))) {
    throw new Error("Embedding contained non-numeric values");
  }
  return embedding;
}

/**
 * Cosine distance via `<=>` so the HNSW index on MemoryChunk.embedding is
 * used. Raw SQL is required because `embedding` is a Prisma `Unsupported`
 * column; the vector and the pool size are bound as parameters.
 */
async function nearestChunks(
  embedding: number[],
  poolSize: number,
): Promise<ChunkRow[]> {
  const literal = `[${embedding.join(",")}]`;
  return prisma.$queryRaw<ChunkRow[]>`
    SELECT "sourcePath", "title", "content",
           embedding <=> ${literal}::vector AS distance
    FROM "MemoryChunk"
    WHERE embedding IS NOT NULL
    ORDER BY embedding <=> ${literal}::vector
    LIMIT ${poolSize}
  `;
}

function visiblePassages(
  rows: readonly ChunkRow[],
  allowConfidential: boolean,
): VectorPassage[] {
  const byPath = new Map<string, CorpusDocument>();
  for (const doc of getCorpus()) byPath.set(doc.path, doc);

  const passages: VectorPassage[] = [];
  for (const row of rows) {
    const path = normalizePath(row.sourcePath);
    const doc = byPath.get(path);
    // Unresolved sourcePath means untagged, and untagged means confidential.
    const isPublic = doc?.visibility === "public";
    if (!isPublic && !allowConfidential) continue;

    const distance = Number(row.distance);
    if (!Number.isFinite(distance)) continue;
    const similarity = 1 - distance;
    if (similarity < MIN_SIMILARITY) continue;

    passages.push({
      title: doc?.title ?? row.title,
      path: doc?.path ?? path,
      excerpt: truncate(row.content),
      score: similarity,
    });
  }
  return passages;
}

function normalizePath(sourcePath: string): string {
  return sourcePath.replace(/\\/g, "/").replace(/^\.\//, "");
}

function truncate(text: string): string {
  const trimmed = text.trim();
  return trimmed.length > EXCERPT_LIMIT
    ? `${trimmed.slice(0, EXCERPT_LIMIT)}…`
    : trimmed;
}
