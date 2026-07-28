-- Switch embeddings from 1536 (OpenAI text-embedding-3-small) to 768
-- (Google Gemini text-embedding-004). The dimension change requires an empty
-- embedding column, so existing chunks are cleared — documents are re-embedded
-- automatically the next time they're indexed (the app re-runs on update, and
-- any doc can be re-saved to re-index).

-- The ivfflat index is bound to the column type; drop it before altering.
drop index if exists public.document_chunks_embedding_idx;

-- Clear existing vectors (none are valid after the provider swap anyway).
truncate table public.document_chunks;

alter table public.document_chunks
  alter column embedding type extensions.vector(768);

create index if not exists document_chunks_embedding_idx
  on public.document_chunks
  using ivfflat (embedding extensions.vector_cosine_ops)
  with (lists = 100);

-- Recreate the search RPC with an UNSIZED vector parameter so it accepts the
-- new dimension (and any future one) without another signature migration.
create or replace function public.match_document_chunks(
  query_embedding extensions.vector,
  match_count     int  default 5,
  filter_user_id  uuid default null
)
returns table (
  id             uuid,
  document_id    uuid,
  document_title text,
  chunk_text     text,
  similarity     float
)
language sql
stable
as $$
  select
    dc.id,
    dc.document_id,
    d.title as document_title,
    dc.chunk_text,
    1 - (dc.embedding <=> query_embedding) as similarity
  from public.document_chunks dc
  join public.documents d on d.id = dc.document_id
  where d.user_id = coalesce(filter_user_id, auth.uid())
  order by dc.embedding <=> query_embedding
  limit match_count;
$$;
