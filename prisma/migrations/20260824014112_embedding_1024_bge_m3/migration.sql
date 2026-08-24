-- Resize MemoryChunk.embedding from vector(1536) (OpenAI-shaped, never
-- populated) to vector(1024) for Cloudflare Workers AI @cf/baai/bge-m3.
-- Column is all-null, so drop/recreate loses nothing.
ALTER TABLE "MemoryChunk" DROP COLUMN "embedding";
ALTER TABLE "MemoryChunk" ADD COLUMN "embedding" vector(1024);

-- Cosine-distance HNSW index for retrieval.
CREATE INDEX "MemoryChunk_embedding_hnsw"
  ON "MemoryChunk" USING hnsw ("embedding" vector_cosine_ops);
