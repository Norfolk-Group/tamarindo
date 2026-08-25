#!/usr/bin/env node
/**
 * Populates MemoryChunk.embedding (pgvector, 1024 dims) for rows where it is
 * NULL, using Cloudflare Workers AI @cf/baai/bge-m3.
 *
 *   set -a; source .env; set +a; node scripts/embed-chunks.mjs
 *   node --env-file=.env scripts/embed-chunks.mjs --only knowledge/documents/foo.txt
 *
 * Requires DATABASE_URL, CLOUDFLARE_ACCOUNT_ID, CLOUDFLARE_API_TOKEN.
 * Does not migrate; assumes the vector(1024) column + HNSW index exist.
 * --only embeds null rows for those sourcePath(s) only.
 */

const BATCH_SIZE = 16;
/** bge-m3 does not need a whole meeting transcript; the API batch cap is 60k tokens. */
const MAX_CHARS = 4_000;
const MAX_BATCH_CHARS = 24_000;
const EXPECTED_DIMS = 1024;
const FETCH_TIMEOUT_MS = 20_000;
const MAX_RETRIES = 2;

const onlyIdx = process.argv.indexOf("--only");
const ONLY = onlyIdx >= 0
  ? process.argv.slice(onlyIdx + 1).filter((a) => !a.startsWith("--"))
  : [];

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

// Engine-less client: the pg driver adapter carries the connection.
const { PrismaClient } = await import("@prisma/client");
const { PrismaPg } = await import("@prisma/adapter-pg");
const prisma = new PrismaClient({
  adapter: new PrismaPg({ connectionString: DATABASE_URL, maxUses: 1 }),
});

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

function clip(text) {
  if (text.length <= MAX_CHARS) return text;
  return `${text.slice(0, MAX_CHARS)}\n`;
}

function batchesOf(rows) {
  const batches = [];
  let current = [];
  let chars = 0;
  for (const row of rows) {
    const n = Math.min(row.content.length, MAX_CHARS);
    if (
      current.length > 0 &&
      (current.length >= BATCH_SIZE || chars + n > MAX_BATCH_CHARS)
    ) {
      batches.push(current);
      current = [];
      chars = 0;
    }
    current.push(row);
    chars += n;
  }
  if (current.length) batches.push(current);
  return batches;
}

const pending = await prisma.$queryRaw`
  SELECT id, content, "sourcePath" FROM "MemoryChunk" WHERE embedding IS NULL
`;
const rows = ONLY.length
  ? pending.filter((row) => ONLY.includes(row.sourcePath))
  : pending;
console.log(
  `Found ${rows.length} chunks without embeddings${
    ONLY.length ? ` for ${ONLY.join(", ")}` : ""
  }.`,
);

let done = 0;
let batches = 0;
for (const batch of batchesOf(rows)) {
  const vectors = await embedBatch(batch.map((r) => clip(r.content)));
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
