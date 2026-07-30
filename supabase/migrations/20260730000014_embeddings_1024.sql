-- Switch embeddings to Jina (jina-embeddings-v3, 1024 dims). Gemini's free tier
-- rate-limits gemini-embedding-001 too aggressively for reliable use; Jina has
-- a genuinely free tier (no card). Chat stays on Gemini (split providers).
--
-- Dimension change requires an empty embedding column; existing chunks are
-- cleared and re-indexed on next document save. The match RPC already takes an
-- unsized vector (migration 013), so it needs no change.

drop index if exists public.document_chunks_embedding_idx;

truncate table public.document_chunks;

alter table public.document_chunks
  alter column embedding type extensions.vector(1024);

create index if not exists document_chunks_embedding_idx
  on public.document_chunks
  using ivfflat (embedding extensions.vector_cosine_ops)
  with (lists = 100);
