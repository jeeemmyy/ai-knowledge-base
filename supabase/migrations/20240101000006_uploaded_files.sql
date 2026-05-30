-- Original file metadata for a future upload feature (ST-01, deferred).
-- Not used in v1, but the schema reserves the space so enabling upload later
-- is purely additive.
create table if not exists public.uploaded_files (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users (id) on delete cascade,
  filename     text not null,
  mime_type    text not null,
  size_bytes   bigint not null default 0,
  storage_path text not null,
  status       text not null default 'pending'
                 check (status in ('pending', 'extracting', 'extracted', 'failed')),
  created_at   timestamptz not null default now()
);

create index if not exists uploaded_files_user_idx
  on public.uploaded_files (user_id);

-- Now that uploaded_files exists, wire the nullable FK on documents.
alter table public.documents
  add constraint documents_source_file_fk
  foreign key (source_file_id) references public.uploaded_files (id) on delete set null;
