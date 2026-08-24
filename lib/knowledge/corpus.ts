import { bundledDocuments } from "./corpus.generated";

export type KnowledgeVisibility = "public" | "confidential";

export type CorpusDocument = {
  path: string;
  title: string;
  text: string;
  /** Untagged documents are treated as confidential by callers. */
  visibility: KnowledgeVisibility;
};

export type CorpusPassage = {
  title: string;
  path: string;
  excerpt: string;
  score: number;
  visibility: KnowledgeVisibility;
};

let override: readonly CorpusDocument[] | null = null;

export function setCorpusForTests(docs: readonly CorpusDocument[] | null): void {
  override = docs;
}

export function getCorpus(): readonly CorpusDocument[] {
  if (override) return override;
  return bundledDocuments;
}
