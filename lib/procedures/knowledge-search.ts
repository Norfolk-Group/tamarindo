import { z } from "zod";
import { canReadConfidential } from "@/lib/domain/access";
import { getCorpus, type CorpusDocument } from "@/lib/knowledge/corpus";
import { vectorPassages } from "@/lib/knowledge/vector-search";
import { defineProcedure } from "@/lib/procedures/registry";

/**
 * knowledge.search — hybrid retrieval over the bundled knowledge corpus.
 *
 * Keyword ranking runs against an injectable in-memory corpus (see
 * lib/knowledge/corpus.ts) and is the baseline: it wins exact-token lookups
 * like "ICP-3" or "Hyperdrive". Semantic recall over pgvector runs alongside
 * it (see lib/knowledge/vector-search.ts) and degrades to nothing when
 * Workers AI or the database is unavailable.
 * Confidential passages require ndaSignedAt plus a current-template
 * NdaSignature (R5 / KTD3), except for admins. Untagged documents are
 * confidential.
 */

const InputSchema = z.object({
  query: z.string().min(2).max(500),
  limit: z.number().int().min(1).max(10).default(5),
});

const PassageSchema = z.object({
  title: z.string(),
  path: z.string(),
  excerpt: z.string(),
  score: z.number(),
});

const OutputSchema = z.object({
  passages: z.array(PassageSchema),
});

export type KnowledgePassage = z.infer<typeof PassageSchema>;

/** Dropped so "what is an ICP?" searches for `icp`, not `what`. */
const STOPWORDS = new Set([
  "about",
  "all",
  "and",
  "any",
  "are",
  "been",
  "being",
  "but",
  "can",
  "could",
  "did",
  "does",
  "for",
  "from",
  "has",
  "have",
  "how",
  "into",
  "its",
  "not",
  "our",
  "out",
  "should",
  "than",
  "that",
  "the",
  "them",
  "then",
  "they",
  "this",
  "was",
  "were",
  "what",
  "when",
  "where",
  "which",
  "who",
  "why",
  "will",
  "with",
  "would",
  "you",
  "your",
]);

const THESIS_OVERVIEW = "knowledge/thesis/01-thesis.md";

export const knowledgeSearch = defineProcedure({
  name: "knowledge.search",
  description:
    "Search Tamarindo's knowledge base (thesis, meeting summaries, document digests) and return the most relevant passages.",
  input: InputSchema,
  output: OutputSchema,
  minRole: "investor",
  requiresApproval: false,
  handler: async ({ query, limit }, ctx) => {
    const confidential = await canReadConfidential(ctx.actor);
    const docs = getCorpus().filter(
      (doc) => doc.visibility === "public" || confidential,
    );
    if (docs.length === 0) return { passages: [] };

    const terms = tokenize(query);
    const keyword =
      terms.length === 0
        ? overviewPassages(docs, limit)
        : rankPassages(docs, terms, limit);
    const vector = await vectorPassages({
      query,
      limit,
      allowConfidential: confidential,
    });
    const passages = mergeRankedPassages(keyword, vector, limit);

    return {
      passages: passages.length > 0 ? passages : overviewPassages(docs, limit),
    };
  },
});

/**
 * Keyword scores (term hits plus title and path bias) and vector scores
 * (cosine similarity) live on unrelated scales, so each channel is divided
 * by its own best score to get a relative strength in (0, 1]. Keyword keeps
 * the full band and vector is capped just below it: the tuned keyword top
 * hit always stays first, while vector hits still outrank weaker keyword
 * hits and fill the remaining slots — recall without regressing precision.
 */
const VECTOR_WEIGHT = 0.9;

/** Same document plus the same opening text is the same passage, even when
 *  one side was truncated at the excerpt limit. */
const DEDUPE_PREFIX = 120;

function mergeRankedPassages(
  keyword: readonly KnowledgePassage[],
  vector: readonly KnowledgePassage[],
  limit: number,
): KnowledgePassage[] {
  const ranked = [
    ...normalizeScores(keyword, 1),
    ...normalizeScores(vector, VECTOR_WEIGHT),
  ].sort((a, b) => b.score - a.score);

  const seen = new Set<string>();
  const merged: KnowledgePassage[] = [];
  for (const passage of ranked) {
    const key = dedupeKey(passage);
    if (seen.has(key)) continue;
    seen.add(key);
    merged.push(passage);
    if (merged.length === limit) break;
  }
  return merged;
}

function normalizeScores(
  passages: readonly KnowledgePassage[],
  weight: number,
): KnowledgePassage[] {
  const top = Math.max(0, ...passages.map((p) => p.score));
  if (top === 0) return passages.map((p) => ({ ...p, score: 0 }));
  return passages.map((p) => ({ ...p, score: (p.score / top) * weight }));
}

function dedupeKey(passage: KnowledgePassage): string {
  const normalized = passage.excerpt
    .toLowerCase()
    .replace(/\s+/g, " ")
    .replace(/…+$/, "")
    .trim();
  return `${passage.path}::${normalized.slice(0, DEDUPE_PREFIX)}`;
}

function rankPassages(
  docs: readonly CorpusDocument[],
  terms: string[],
  limit: number,
): KnowledgePassage[] {
  const passages: KnowledgePassage[] = [];
  const aboutNico = terms.some((t) => t === "nico");

  for (const doc of docs) {
    const titleTerms = new Set(tokenize(`${doc.title} ${doc.path}`));
    const titleHits = terms.filter((t) => titleTerms.has(t)).length;
    const bias = pathBias(doc.path, aboutNico);
    const blocks = splitIntoBlocks(doc.text);
    let titleFallbackUsed = false;

    for (const block of blocks) {
      const content = scoreBlock(tokenize(block), terms);
      if (content === 0 && titleHits === 0) continue;
      if (content === 0) {
        if (titleFallbackUsed) continue;
        titleFallbackUsed = true;
      }
      passages.push(
        toPassage(doc, block, content + titleHits * 3 + bias),
      );
    }
  }

  passages.sort((a, b) => b.score - a.score);
  return passages.slice(0, limit);
}

function overviewPassages(
  docs: readonly CorpusDocument[],
  limit: number,
): KnowledgePassage[] {
  const preferred =
    docs.find((d) => d.path === THESIS_OVERVIEW) ??
    docs.find((d) => d.path.startsWith("knowledge/thesis/")) ??
    docs[0];
  if (!preferred) return [];
  return splitIntoBlocks(preferred.text)
    .slice(0, limit)
    .map((block) => toPassage(preferred, block, 0.1));
}

function pathBias(path: string, aboutNico: boolean): number {
  if (path.startsWith("knowledge/thesis")) return aboutNico ? 0 : 1.25;
  if (path.startsWith("knowledge/qa")) return aboutNico ? 0 : 1.1;
  if (path.startsWith("docs/nico")) return aboutNico ? 1.25 : 0;
  return 0;
}

function toPassage(
  doc: CorpusDocument,
  block: string,
  score: number,
): KnowledgePassage {
  return {
    title: doc.title,
    path: doc.path,
    excerpt: block.length > 900 ? `${block.slice(0, 900)}…` : block,
    score,
  };
}

function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9áéíóúñü\s-]/g, " ")
    .split(/\s+/)
    .filter((t) => t.length > 2 && !STOPWORDS.has(t));
}

function splitIntoBlocks(markdown: string): string[] {
  const chunks = markdown.split(/(?=^#{2,3} )/m);
  const blocks: string[] = [];
  for (const chunk of chunks) {
    for (const raw of chunk.split(/\n\s*\n/)) {
      const block = raw.trim();
      if (block.length > 80 && !block.startsWith("```")) blocks.push(block);
    }
  }
  return blocks;
}

function scoreBlock(blockTerms: string[], queryTerms: string[]): number {
  if (blockTerms.length === 0) return 0;
  const set = new Set(blockTerms);
  let hits = 0;
  for (const term of queryTerms) if (set.has(term)) hits += 1;
  return hits === 0 ? 0 : hits + hits / Math.sqrt(blockTerms.length);
}
