# AI Knowledge Base

A full-stack, AI-powered knowledge base. Users create and manage documents, then
ask questions through a chat interface that retrieves relevant context (RAG) and
answers grounded **only** in the user's own documents — with citations back to the
source.

---

## Stack

| Layer    | Technology                                          |
| -------- | --------------------------------------------------- |
| Monorepo | Turborepo + pnpm workspaces                         |
| Frontend | Next.js 15 (App Router) · React 19 · Tailwind · shadcn-style UI |
| Backend  | NestJS 11                                           |
| Database | Supabase Cloud (Postgres + pgvector)                |
| Auth     | Supabase Auth (email/password, JWT)                 |
| AI       | Provider-agnostic — any OpenAI-compatible endpoint  |

---

## Quick start

**Prerequisites:** Node >= 22, pnpm >= 10 (`setup.sh` enables it via corepack), and a
free [Supabase](https://supabase.com) project.

```bash
# 1. Install + scaffold env
./setup.sh                 # installs deps, copies .env.example -> .env

# 2. Fill in .env  (Supabase URL/keys + your AI provider key — see below)

# 3. Push the database schema to your Supabase project
pnpm db:push               # applies supabase/migrations via the Supabase CLI
pnpm db:types              # (optional) regenerate typed DB definitions

# 4. Run everything
pnpm dev                   # web -> http://localhost:3000   api -> http://localhost:3001
```

Then open <http://localhost:3000>, create an account, add a document, and ask a
question about it. `GET http://localhost:3001/health` reports API + DB status.

> **Supabase setup:** create a project, then copy the URL, `anon` key, and
> `service_role` key from *Project Settings -> API* into `.env`. The migrations
> enable `pgvector`, create all tables, RLS policies, and two RPC functions.
> For local dev, disable "Confirm email" under *Authentication -> Providers -> Email*
> so signups log in immediately.

---

## Repository layout

```
ai-knowledge-base/
├── apps/
│   ├── api/                 NestJS backend
│   │   └── src/
│   │       ├── modules/
│   │       │   ├── ai/        provider-agnostic chat + embedding layer (+ tests)
│   │       │   ├── auth/      Supabase JWT guard + CurrentUser decorator
│   │       │   ├── documents/ CRUD (controller -> service -> repository)
│   │       │   ├── rag/       chunking (+ tests), embedding, retrieval, atomic swap
│   │       │   └── chat/      conversations, messages, prompt builder, orchestration
│   │       ├── common/        Supabase client, exception filter, shared types
│   │       └── config/        env loading + validation for the AI layer
│   └── web/                 Next.js frontend (App Router)
│       └── src/
│           ├── app/          (auth) and (app) route groups
│           ├── components/    ui/ (shadcn-style), documents/, chat/, layout/
│           └── lib/           api client, hooks, supabase client
├── packages/
│   ├── shared/              cross-cutting TS types — incl. the AI provider contract
│   ├── config/              shared tsconfig / eslint / prettier
│   └── utils/               small pure helpers
└── supabase/migrations/     10 ordered SQL migrations (schema, RLS, RPCs)
```

---

## Architecture decisions

### 1. The AI layer is genuinely swappable — by `.env` alone

This was the top design priority. Two **separate** contracts live in
`packages/shared` so nothing in the app depends on a concrete vendor:

```ts
interface IChatProvider      { chat(messages, options): Promise<ChatResponse>; }
interface IEmbeddingProvider { embed(input): Promise<number[][]>; readonly dimensions: number; }
```

Chat and embeddings are split deliberately — some providers offer one but not the
other, and you may want (say) Groq for chat and OpenAI for embeddings. Each is
built by a **factory** that reads env config and is injected via a NestJS DI token,
so the rest of the backend depends only on the `AiService` facade:

```
AiService ──▶ CHAT_PROVIDER       (IChatProvider)      ◀── createChatProvider()      ◀── env
          └─▶ EMBEDDING_PROVIDER  (IEmbeddingProvider) ◀── createEmbeddingProvider() ◀── env
```

A single `OpenAICompatibleProvider` family covers OpenAI, Groq, Together,
OpenRouter, and **Ollama** (local) because they all speak the same wire format —
only `baseURL` / `apiKey` / `model` differ. No provider-specific branching exists
in the code. See the [provider swap guide](#swapping-ai-providers) below.

### 2. Supabase Cloud, not local Docker

The original scope considered a Docker Compose stack. I dropped it deliberately:

- A reviewer needs only a URL + keys to run the project — no container orchestration.
- `pgvector`, RLS, and Auth behave exactly as they would in the real target
  environment, so there are no "works locally, breaks in prod" surprises.
- The "runs locally" requirement is satisfied where it matters — the **AI layer** —
  by pointing it at a local Ollama endpoint (zero API cost, fully offline).

### 3. RAG: chunk -> embed -> atomic swap

- **Chunking** uses real token counting (`js-tiktoken`, `cl100k_base`), not a
  character approximation, with a recursive splitter that prefers natural
  boundaries (paragraph -> line -> sentence -> word) and only hard-cuts as a last
  resort. Default 512 tokens / 100 overlap.
- **Re-indexing is safe.** On document update, new embeddings are generated
  *before* any database write, then old and new chunks are swapped inside a single
  transaction (`replace_document_chunks` RPC). A provider failure leaves the
  previous chunks intact; a reader never sees a half-written state.
- **Retrieval is always user-scoped.** The `match_document_chunks` RPC filters by
  the caller's user id (passed explicitly by the API), so similarity search can
  never cross users.

### 4. Defense-in-depth auth

The API validates the Supabase JWT on every protected route (`SupabaseAuthGuard`),
then enforces ownership in application code (every query is scoped by `user_id`).
**Row Level Security** is enabled on all tables as a second layer: even direct
database access via the `anon` key cannot read another user's rows. The API uses
the `service_role` key (which bypasses RLS) and therefore treats the app-level
ownership checks as primary, with RLS as the backstop.

### 5. Repository pattern + thin controllers

Controllers handle HTTP and validation; services hold orchestration; repositories
own all database access. DTOs are validated with `class-validator` via a global
`ValidationPipe` (`whitelist` + `forbidNonWhitelisted`). A global exception filter
returns one consistent error shape and never leaks internals.

---

## Swapping AI providers

Everything is driven by environment variables — **no code changes**. Chat and
embeddings are configured independently.

**OpenAI (default)**
```env
AI_CHAT_BASE_URL=https://api.openai.com/v1
AI_CHAT_API_KEY=sk-...
AI_CHAT_MODEL=gpt-4o-mini
AI_EMBEDDING_BASE_URL=https://api.openai.com/v1
AI_EMBEDDING_API_KEY=sk-...
AI_EMBEDDING_MODEL=text-embedding-3-small
AI_EMBEDDING_DIMENSIONS=1536
```

**Groq for chat (fast/cheap), OpenAI for embeddings**
```env
AI_CHAT_BASE_URL=https://api.groq.com/openai/v1
AI_CHAT_API_KEY=gsk_...
AI_CHAT_MODEL=llama-3.3-70b-versatile
# embeddings stay on OpenAI as above
```

**Fully local with Ollama** (no API key, offline)
```env
AI_CHAT_BASE_URL=http://localhost:11434/v1
AI_CHAT_API_KEY=ollama
AI_CHAT_MODEL=llama3.1
AI_EMBEDDING_BASE_URL=http://localhost:11434/v1
AI_EMBEDDING_API_KEY=ollama
AI_EMBEDDING_MODEL=nomic-embed-text
AI_EMBEDDING_DIMENSIONS=768
```

> **Embedding dimensions must match the database.** `document_chunks.embedding`
> is `vector(1536)`. If you switch to a model with different dimensions (e.g.
> `nomic-embed-text` = 768), update `AI_EMBEDDING_DIMENSIONS` **and** the
> `vector(N)` size in `supabase/migrations/..._document_chunks.sql` before first
> run, then re-embed. The embedding provider throws a clear error on mismatch.

To add a genuinely different protocol (e.g. a non-OpenAI-shaped API), implement
`IChatProvider` / `IEmbeddingProvider` in a new provider class and add one branch
to the relevant factory. Nothing else changes.

---

## Testing

```bash
pnpm --filter @repo/api test         # AI provider + chunking unit tests
pnpm --filter @repo/api type-check
pnpm --filter @repo/web type-check
```

The suite covers the parts most worth protecting: the provider abstraction
(factory selection, env validation, response/usage mapping, model override,
the embedding dimension guard, input ordering) and the chunking logic (token
counting, splitting, overlap, and the pathological no-separator path).

---

## What I'd add next

- **Streaming responses.** The `IChatProvider` contract is ready for a `stream()`
  method; the UI already isolates the assistant bubble, so SSE / `ReadableStream`
  wiring is the main work.
- **File upload ingestion.** The schema already reserves `uploaded_files` and
  `documents.source_file_id`; add extraction (PDF/docx -> text) and reuse the
  existing chunk -> embed pipeline.
- **Hybrid retrieval + reranking.** Combine vector search with keyword/full-text
  search and a rerank pass for higher precision on large corpora.
- **`ivfflat` -> `hnsw`** and tuned index parameters once data volume grows.
- **Per-user rate limiting and a usage dashboard** (the `usage_logs` table is
  already populated on every chat).
- **E2E tests** (Playwright) over the auth -> create doc -> chat -> citation flow.

---

## Scripts

| Command          | What it does                                           |
| ---------------- | ------------------------------------------------------ |
| `pnpm dev`       | Run web + api in parallel (Turborepo)                  |
| `pnpm build`     | Build all workspaces                                   |
| `pnpm lint`      | Lint all workspaces                                    |
| `pnpm type-check`| Typecheck all workspaces                               |
| `pnpm db:push`   | Apply Supabase migrations                              |
| `pnpm db:types`  | Regenerate typed DB definitions into `packages/shared` |
