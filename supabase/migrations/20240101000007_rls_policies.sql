-- =============================================================================
-- Row Level Security: defense-in-depth alongside the NestJS guard + ownership
-- checks. A bug in application code cannot leak data across users.
--
-- NOTE: the API uses the service_role key, which BYPASSES RLS. These policies
-- protect direct access via the anon key (e.g. the browser Supabase client)
-- and any future direct queries. The API additionally enforces ownership in
-- code and always scopes the similarity-search RPC by user id.
-- =============================================================================

alter table public.documents       enable row level security;
alter table public.document_chunks enable row level security;
alter table public.conversations   enable row level security;
alter table public.messages        enable row level security;
alter table public.usage_logs      enable row level security;
alter table public.uploaded_files  enable row level security;

-- ---- Direct ownership: auth.uid() = user_id -------------------------------
create policy "documents_owner" on public.documents
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "conversations_owner" on public.conversations
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "usage_logs_owner" on public.usage_logs
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "uploaded_files_owner" on public.uploaded_files
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ---- Indirect ownership: document_chunks via parent document --------------
create policy "document_chunks_owner" on public.document_chunks
  for all
  using (
    exists (
      select 1 from public.documents d
      where d.id = document_chunks.document_id
        and d.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.documents d
      where d.id = document_chunks.document_id
        and d.user_id = auth.uid()
    )
  );

-- ---- Indirect ownership: messages via parent conversation -----------------
create policy "messages_owner" on public.messages
  for all
  using (
    exists (
      select 1 from public.conversations c
      where c.id = messages.conversation_id
        and c.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.conversations c
      where c.id = messages.conversation_id
        and c.user_id = auth.uid()
    )
  );
