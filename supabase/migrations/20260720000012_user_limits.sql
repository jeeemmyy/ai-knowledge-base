-- Per-user usage limits. Free (non-unlimited) users get lifetime caps:
--   5 documents ever, 10 messages ever, unlimited conversations.
-- An admin can flip `unlimited` to remove all caps for a user. Counters are
-- monotonic (never decremented) so deleting a document does not free a slot.

alter table public.user_profiles
  add column if not exists unlimited boolean not null default false,
  add column if not exists documents_created integer not null default 0,
  add column if not exists messages_sent integer not null default 0;

-- Grandfather every existing account as unlimited so the new caps only apply
-- to future signups.
update public.user_profiles set unlimited = true;

-- Atomic increment-or-create for the lifetime counters (used on each
-- successful document create / message send).
create or replace function public.increment_documents_created(p_user_id uuid)
returns integer language plpgsql security definer set search_path = public as $$
declare new_count integer;
begin
  insert into public.user_profiles (user_id, documents_created)
    values (p_user_id, 1)
  on conflict (user_id) do update
    set documents_created = user_profiles.documents_created + 1, updated_at = now()
  returning documents_created into new_count;
  return new_count;
end; $$;

create or replace function public.increment_messages_sent(p_user_id uuid)
returns integer language plpgsql security definer set search_path = public as $$
declare new_count integer;
begin
  insert into public.user_profiles (user_id, messages_sent)
    values (p_user_id, 1)
  on conflict (user_id) do update
    set messages_sent = user_profiles.messages_sent + 1, updated_at = now()
  returning messages_sent into new_count;
  return new_count;
end; $$;
