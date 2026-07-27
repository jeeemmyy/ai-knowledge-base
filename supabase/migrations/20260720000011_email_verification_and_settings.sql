-- Email verification, password-reset codes, and app-level settings.
-- All rows are managed by the API with the service role; RLS denies direct
-- anon/authenticated access (user_profiles allows a user to read only its own
-- row, as defense-in-depth).

-- Global key/value settings (e.g. the SendGrid API key + sender identity).
create table if not exists public.app_settings (
  key text primary key,
  value text,
  updated_at timestamptz not null default now()
);

alter table public.app_settings enable row level security;
-- No policies: only the service role (which bypasses RLS) may read/write.

-- Per-user profile carrying verification + reset state. Codes are short-lived
-- 6-digit strings; only one of each is valid at a time.
create table if not exists public.user_profiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  email text,
  email_verified boolean not null default false,
  verification_code text,
  verification_expires_at timestamptz,
  verification_sent_at timestamptz,
  reset_code text,
  reset_expires_at timestamptz,
  reset_sent_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists user_profiles_email_idx on public.user_profiles (lower(email));

alter table public.user_profiles enable row level security;

create policy "user_profiles_select_own" on public.user_profiles
  for select using (auth.uid() = user_id);

-- Grandfather every existing account as verified so no one is locked out when
-- the verification gate ships.
insert into public.user_profiles (user_id, email, email_verified)
select id, email, true
from auth.users
on conflict (user_id) do nothing;
