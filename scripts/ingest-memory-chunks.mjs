#!/usr/bin/env node
/**
 * Optional MemoryChunk ingest. Default is dry-run.
 * Does not migrate. Does not write embeddings (pgvector job is separate).
 *
 *   node scripts/ingest-memory-chunks.mjs
 *   node scripts/ingest-memory-chunks.mjs --apply   # needs DATABASE_URL
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";

const ROOT = path.resolve(import.meta.dirname, "..");
const APPLY = process.argv.includes("--apply");

function walk(dir, acc = []) {
  for (const name of readdirSync(dir)) {
    if (name.startsWith(".")) continue;
    const full = path.join(dir, name);
    if (statSync(full).isDirectory()) walk(full, acc);
    else if (name.endsWith(".md")) acc.push(full);
  }
  return acc;
}

function chunksFrom(markdown) {
  return markdown
    .split(/(?=^#{2,3} )/m)
    .flatMap((part) => part.split(/\n\s*\n/))
    .map((s) => s.trim())
    .filter((s) => s.length > 80 && !s.startsWith("```"));
}

const files = [
  ...walk(path.join(ROOT, "knowledge/thesis")),
  ...walk(path.join(ROOT, "knowledge/qa")),
];

let n = 0;
for (const file of files) {
  const rel = path.relative(ROOT, file);
  const text = readFileSync(file, "utf8");
  const title = (text.match(/^#\s+(.+)$/m) || [null, rel])[1];
  const parts = chunksFrom(text);
  n += parts.length;
  if (!APPLY) {
    console.log(`${rel}: ${parts.length} chunks (${title})`);
  }
}

console.log(`Total chunks ready: ${n}`);
if (!APPLY) {
  console.log(
    "Dry-run only. Pass --apply with DATABASE_URL to upsert MemoryChunk rows without embeddings. Do not run a migration from this script.",
  );
  process.exit(0);
}

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL missing; refusing to apply.");
  process.exit(1);
}

const { PrismaClient } = await import("@prisma/client");
const prisma = new PrismaClient();
let upserts = 0;
for (const file of files) {
  const rel = path.relative(ROOT, file);
  const text = readFileSync(file, "utf8");
  const title = (text.match(/^#\s+(.+)$/m) || [null, rel])[1];
  const parts = chunksFrom(text);
  await prisma.memoryChunk.deleteMany({ where: { sourcePath: rel } });
  for (const content of parts) {
    await prisma.memoryChunk.create({
      data: { sourcePath: rel, title, content, metadata: { kind: "markdown" } },
    });
    upserts += 1;
  }
}
await prisma.$disconnect();
console.log(`Upserted ${upserts} MemoryChunk rows (embedding left null).`);
