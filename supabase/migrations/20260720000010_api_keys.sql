-- Per-user API keys for server-to-server access (e.g. a Bubble frontend).
-- Only a SHA-256 hash of the key is stored; the plaintext is shown once at
-- creation and never persisted. The API resolves X-API-Key -> user via the
-- hash, using the service role (bypasses RLS). RLS below is defense-in-depth
-- so the anon/authenticated roles can only ever see their own keys.

create table if not exists public.api_keys (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  name text not null default 'API key',
  key_hash text not null unique,
  key_prefix text not null,
  created_at timestamptz not null default now(),
  last_used_at timestamptz
);

create index if not exists api_keys_user_id_idx on public.api_keys (user_id);

alter table public.api_keys enable row level security;

-- Idempotent: drop first so re-running this file never errors on existing policies.
drop policy if exists "api_keys_select_own" on public.api_keys;
create policy "api_keys_select_own" on public.api_keys
  for select using (auth.uid() = user_id);

drop policy if exists "api_keys_delete_own" on public.api_keys;
create policy "api_keys_delete_own" on public.api_keys
  for delete using (auth.uid() = user_id);
