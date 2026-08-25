#!/usr/bin/env node
/**
 * Optional MemoryChunk ingest. Default is dry-run.
 * Does not migrate. Does not write embeddings (pgvector job is separate).
 *
 *   node scripts/ingest-memory-chunks.mjs
 *   node scripts/ingest-memory-chunks.mjs --apply   # needs DATABASE_URL
 *   node scripts/ingest-memory-chunks.mjs --apply --only knowledge/thesis/17-end-of-lease-title.md
 *
 * --only upserts listed sourcePath(s) only. Full --apply deleteManys every
 * file and drops embeddings — do not use it to add a few docs.
 */
import { readFileSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { ingestDeniedReason } from "./lib/ingest-deny.mjs";

const ROOT = path.resolve(import.meta.dirname, "..");
const APPLY = process.argv.includes("--apply");
const onlyIdx = process.argv.indexOf("--only");
const ONLY = onlyIdx >= 0
  ? process.argv.slice(onlyIdx + 1).filter((a) => !a.startsWith("--"))
  : [];
const TEXT_EXT = /\.(md|txt)$/i;
const SOURCES = [
  "knowledge/thesis",
  "knowledge/qa",
  "knowledge/documents",
  "knowledge/meetings",
];

function walk(dir, acc = []) {
  let names;
  try {
    names = readdirSync(dir);
  } catch {
    return acc;
  }
  for (const name of names) {
    if (name.startsWith(".")) continue;
    const full = path.join(dir, name);
    if (statSync(full).isDirectory()) walk(full, acc);
    else if (TEXT_EXT.test(name)) acc.push(full);
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

let files = SOURCES.flatMap((dir) => walk(path.join(ROOT, dir))).sort();
if (ONLY.length) {
  const wanted = new Set(
    ONLY.map((p) => p.split(path.sep).join("/")),
  );
  files = files.filter((file) =>
    wanted.has(path.relative(ROOT, file).split(path.sep).join("/")),
  );
  const found = new Set(
    files.map((file) => path.relative(ROOT, file).split(path.sep).join("/")),
  );
  for (const rel of wanted) {
    if (!found.has(rel)) {
      console.error(`--only path not found: ${rel}`);
      process.exit(1);
    }
  }
}

let n = 0;
for (const file of files) {
  const rel = path.relative(ROOT, file);
  const text = readFileSync(file, "utf8");
  const denied = ingestDeniedReason(rel, text);
  if (denied) {
    console.log(`${rel}: skipped (${denied})`);
    continue;
  }
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

// Client is generated to lib/generated/prisma (see tsconfig alias); the
// default @prisma/client path is never initialized in this repo.
const { PrismaClient } = await import(
  new URL("../lib/generated/prisma/index.js", import.meta.url).href
);
const prisma = new PrismaClient();
let upserts = 0;
for (const file of files) {
  const rel = path.relative(ROOT, file);
  const text = readFileSync(file, "utf8");
  const denied = ingestDeniedReason(rel, text);
  if (denied) {
    console.log(`${rel}: skipped (${denied})`);
    continue;
  }
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
