-- Enable pgvector for embedding similarity search.
-- Supabase convention: extensions live in the `extensions` schema.
create extension if not exists vector with schema extensions;

-- gen_random_uuid() is available in core Postgres (>=13); no extra extension needed.
