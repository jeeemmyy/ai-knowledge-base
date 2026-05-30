-- Individual chat messages. Assistant messages also store the RAG sources
-- that informed the answer (denormalized jsonb so citations need no joins
-- and survive even if the underlying chunk later changes).
create table if not exists public.messages (
  id              uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references public.conversations (id) on delete cascade,
  role            text not null check (role in ('system', 'user', 'assistant')),
  content         text not null,
  sources         jsonb not null default '[]'::jsonb,
  created_at      timestamptz not null default now()
);

-- Chronological message loading within a conversation.
create index if not exists messages_conversation_created_idx
  on public.messages (conversation_id, created_at);
