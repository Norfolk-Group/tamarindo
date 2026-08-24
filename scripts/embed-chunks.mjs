#!/usr/bin/env node
/**
 * Populates MemoryChunk.embedding (pgvector, 1024 dims) for rows where it is
 * NULL, using Cloudflare Workers AI @cf/baai/bge-m3.
 *
 *   set -a; source .env; set +a; node scripts/embed-chunks.mjs
 *
 * Requires DATABASE_URL, CLOUDFLARE_ACCOUNT_ID, CLOUDFLARE_API_TOKEN.
 * Does not migrate; assumes the vector(1024) column + HNSW index exist.
 */

const BATCH_SIZE = 40;
const EXPECTED_DIMS = 1024;
const FETCH_TIMEOUT_MS = 10_000;
const MAX_RETRIES = 2;

const { DATABASE_URL, CLOUDFLARE_ACCOUNT_ID, CLOUDFLARE_API_TOKEN } =
  process.env;

for (const [name, value] of Object.entries({
  DATABASE_URL,
  CLOUDFLARE_ACCOUNT_ID,
  CLOUDFLARE_API_TOKEN,
})) {
  if (!value) {
    console.error(`${name} missing; refusing to run.`);
    process.exit(1);
  }
}

const API_URL = `https://api.cloudflare.com/client/v4/accounts/${CLOUDFLARE_ACCOUNT_ID}/ai/run/@cf/baai/bge-m3`;

// Client is generated to lib/generated/prisma (see tsconfig alias); the
// default @prisma/client path is never initialized in this repo.
const { PrismaClient } = await import(
  new URL("../lib/generated/prisma/index.js", import.meta.url).href
);
const prisma = new PrismaClient();

async function embedBatch(texts) {
  let lastError;
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt += 1) {
    if (attempt > 0) {
      await new Promise((r) => setTimeout(r, 1000 * attempt));
    }
    try {
      const res = await fetch(API_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${CLOUDFLARE_API_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ text: texts }),
        signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      });
      if (!res.ok) {
        throw new Error(`Workers AI HTTP ${res.status}: ${await res.text()}`);
      }
      const json = await res.json();
      if (json.success === false) {
        throw new Error(`Workers AI error: ${JSON.stringify(json.errors)}`);
      }
      // The bge-m3 REST response is {result:{data:[[...]]}}; some model
      // variants use result.response instead.
      const vectors = json.result?.data ?? json.result?.response;
      if (!Array.isArray(vectors) || vectors.length !== texts.length) {
        throw new Error(
          `Unexpected embedding response shape: got ${
            Array.isArray(vectors) ? vectors.length : typeof vectors
          } vectors for ${texts.length} texts`,
        );
      }
      for (const v of vectors) {
        if (!Array.isArray(v) || v.length !== EXPECTED_DIMS) {
          throw new Error(
            `Embedding has ${Array.isArray(v) ? v.length : typeof v} dims, expected ${EXPECTED_DIMS}. Aborting.`,
          );
        }
      }
      return vectors;
    } catch (err) {
      lastError = err;
      console.warn(
        `Embed attempt ${attempt + 1}/${MAX_RETRIES + 1} failed: ${err.message}`,
      );
    }
  }
  throw new Error(`Embedding failed after retries: ${lastError.message}`);
}

function toVectorLiteral(vector) {
  return `[${vector.join(",")}]`;
}

const rows = await prisma.$queryRaw`
  SELECT id, content FROM "MemoryChunk" WHERE embedding IS NULL
`;
console.log(`Found ${rows.length} chunks without embeddings.`);

let done = 0;
let batches = 0;
for (let i = 0; i < rows.length; i += BATCH_SIZE) {
  const batch = rows.slice(i, i + BATCH_SIZE);
  const vectors = await embedBatch(batch.map((r) => r.content));
  for (let j = 0; j < batch.length; j += 1) {
    await prisma.$executeRawUnsafe(
      `UPDATE "MemoryChunk" SET embedding = $1::vector WHERE id = $2`,
      toVectorLiteral(vectors[j]),
      batch[j].id,
    );
  }
  done += batch.length;
  batches += 1;
  console.log(
    `Batch ${batches}: embedded ${done}/${rows.length} chunks`,
  );
}

await prisma.$disconnect();
console.log(`Done. ${done} chunks embedded in ${batches} batches.`);
