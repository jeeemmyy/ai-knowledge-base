-- User-owned knowledge documents.
create table if not exists public.documents (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references auth.users (id) on delete cascade,
  -- Nullable FK to uploaded_files (added in the uploaded_files migration).
  -- In v1 every document is created via the editor, so this stays null.
  source_file_id uuid,
  title          text not null check (char_length(title) between 1 and 500),
  content        text not null default '',
  tags           text[] not null default '{}',
  created_at     timestamptz not null default now(),
  updated_at     timestamptz not null default now()
);

-- List view: a user's documents, newest first.
create index if not exists documents_user_updated_idx
  on public.documents (user_id, updated_at desc);

-- Keep updated_at fresh on every update.
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger documents_set_updated_at
  before update on public.documents
  for each row execute function public.set_updated_at();
