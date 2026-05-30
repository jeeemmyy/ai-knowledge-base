-- Per-request token tracking for AI calls (powers an optional usage view).
create table if not exists public.usage_logs (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references auth.users (id) on delete cascade,
  conversation_id   uuid references public.conversations (id) on delete set null,
  operation         text not null check (operation in ('chat', 'embedding')),
  model             text not null,
  prompt_tokens     int not null default 0,
  completion_tokens int not null default 0,
  total_tokens      int not null default 0,
  created_at        timestamptz not null default now()
);

create index if not exists usage_logs_user_created_idx
  on public.usage_logs (user_id, created_at desc);
