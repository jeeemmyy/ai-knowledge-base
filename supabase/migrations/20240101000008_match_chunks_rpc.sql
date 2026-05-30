-- Vector similarity search as an RPC so it can be called via PostgREST and
-- so user scoping is enforced in one place.
--
-- The API calls this with the service_role key (RLS bypassed) and ALWAYS
-- passes filter_user_id = the authenticated user's id, so results can never
-- cross users. If ever called under RLS (anon key) with filter_user_id null,
-- it falls back to auth.uid().
create or replace function public.match_document_chunks(
  query_embedding extensions.vector(1536),
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
