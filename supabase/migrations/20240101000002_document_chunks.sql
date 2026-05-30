-- Embedded text chunks used for RAG retrieval.
--
-- IMPORTANT: vector(1536) MUST match AI_EMBEDDING_DIMENSIONS in .env
-- (1536 = text-embedding-3-small). If you configure a different embedding
-- model with different dimensions, change this number BEFORE first run and
-- re-embed any existing chunks.
create table if not exists public.document_chunks (
  id          uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.documents (id) on delete cascade,
  chunk_index int not null,
  chunk_text  text not null,
  embedding   extensions.vector(1536) not null,
  created_at  timestamptz not null default now(),
  unique (document_id, chunk_index)
);

-- Cascade delete/update lookups by parent document.
create index if not exists document_chunks_document_idx
  on public.document_chunks (document_id);

-- Approximate nearest-neighbour index for cosine similarity.
-- Tuned for production scale; harmless (correct, just unused) on tiny datasets.
create index if not exists document_chunks_embedding_idx
  on public.document_chunks
  using ivfflat (embedding extensions.vector_cosine_ops)
  with (lists = 100);
