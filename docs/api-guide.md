# DocBrain API Guide (Bubble & other external clients)

The DocBrain backend is a standalone REST API (NestJS). The Next.js web app is
just one client of it — any HTTP client, including a Bubble app via the **API
Connector** plugin, can use the same endpoints.

- Local base URL: `http://localhost:3001`
- Production base URL: wherever you host the API (Railway / Render / Fly.io —
  see [Deployment](#deployment)). Bubble requires a public HTTPS URL.

All request and response bodies are JSON (`Content-Type: application/json`).

---

## Authentication

Every endpoint except `GET /health` requires authentication. Two methods are
supported; each request uses one or the other.

### Option A — Service API key (simplest; one shared knowledge base)

Best for prototyping or a single-tenant Bubble app. All requests act as **one**
fixed user, so every Bubble user sees the same documents.

**Setup (one time):**

1. Create a dedicated account for the service (sign up once through the web
   app, or Supabase Dashboard → Authentication → Add user).
2. Copy that user's UUID from Supabase Dashboard → Authentication → Users.
3. In the API's `.env`, set:

   ```env
   SERVICE_API_KEY=<random secret — e.g. `openssl rand -hex 32`>
   SERVICE_API_KEY_USER_ID=<that user's UUID>
   ```

4. Restart the API. If either var is unset, the feature is disabled entirely.

**Usage:** send the key on every request:

```
X-API-Key: <SERVICE_API_KEY>
```

In Bubble's API Connector, add a **shared header** `X-API-Key` with the key as
a "Private" value so it is never exposed to the browser.

### Option B — Per-user Supabase JWT (production; per-user data isolation)

Each end user logs in and gets their own private documents — identical to how
the web app works. No backend changes are needed.

Obtain a token by calling **Supabase's auth REST API** directly (Bubble can do
this with two API Connector calls):

```
POST {SUPABASE_URL}/auth/v1/signup                          # register
POST {SUPABASE_URL}/auth/v1/token?grant_type=password       # login
Headers: apikey: {SUPABASE_ANON_KEY}
Body:    { "email": "...", "password": "..." }
```

The response contains `access_token` (expires in ~1 hour) and `refresh_token`.
Refresh with:

```
POST {SUPABASE_URL}/auth/v1/token?grant_type=refresh_token
Headers: apikey: {SUPABASE_ANON_KEY}
Body:    { "refresh_token": "..." }
```

Then call the DocBrain API with:

```
Authorization: Bearer <access_token>
```

In Bubble, store the tokens in the user's data (privacy-ruled) or in a custom
state, and template the header value per request.

---

## Endpoints

Error responses always have the shape:

```json
{ "statusCode": 401, "message": "...", "error": "...", "path": "/documents", "timestamp": "..." }
```

### Health

| Method | Path      | Auth | Notes |
|--------|-----------|------|-------|
| GET    | `/health` | none | `{ status, service, db, timestamp }` |

### Documents

| Method | Path              | Body |
|--------|-------------------|------|
| GET    | `/documents`      | — (returns the caller's documents) |
| GET    | `/documents/:id`  | — |
| POST   | `/documents`      | `{ "title": string (1–500), "content": string (≤1M chars), "tags"?: string[] (≤50 tags, ≤50 chars each) }` |
| PATCH  | `/documents/:id`  | same fields as POST, all optional |
| DELETE | `/documents/:id`  | — (204 No Content) |

Creating or updating a document chunks and embeds its content for retrieval
(the AI embedding provider must be configured and funded). Unknown body fields
are rejected with 400.

**Example — create a document:**

```bash
curl -X POST https://<api-host>/documents \
  -H "Content-Type: application/json" \
  -H "X-API-Key: $SERVICE_API_KEY" \
  -d '{"title":"Onboarding runbook","content":"...","tags":["process"]}'
```

### Conversations & chat

| Method | Path                          | Body |
|--------|-------------------------------|------|
| GET    | `/conversations`              | — |
| POST   | `/conversations`              | `{ "title"?: string (≤200) }` |
| GET    | `/conversations/:id/messages` | — |
| DELETE | `/conversations/:id`          | — (204) |
| POST   | `/chat`                       | `{ "message": string (1–8000), "conversationId"?: uuid }` |

`POST /chat` runs the full RAG pipeline: embeds the question, retrieves the
caller's most relevant chunks, and answers grounded in them with citations.
Omit `conversationId` to start a new conversation (the response includes it —
reuse it for follow-up messages).

**Example — ask a question:**

```bash
curl -X POST https://<api-host>/chat \
  -H "Content-Type: application/json" \
  -H "X-API-Key: $SERVICE_API_KEY" \
  -d '{"message":"What did I write about onboarding?"}'
```

---

## Bubble API Connector quick recipe

1. Install the **API Connector** plugin.
2. Add an API named `DocBrain`, Authentication: *None or self-handled*.
3. Shared headers: `Content-Type: application/json`, plus `X-API-Key`
   (Private) if using Option A.
4. Add one call per endpoint above. Mark body fields you want to template
   (e.g. `<message>`) as dynamic. Set "Use as: Action" for POST/PATCH/DELETE
   and "Use as: Data" for GETs.
5. Click *Initialize call* once (with the API deployed and reachable) so
   Bubble learns the response schema, then use the calls in workflows.

CORS does not apply: Bubble's API Connector calls from Bubble's servers, not
the browser.

---

## Deployment

- **API** — deploy `apps/api` to a Node host (Railway, Render, Fly.io). For
  Render, a ready-made blueprint lives at the repo root: `render.yaml`
  (Dashboard → New → Blueprint → select this repo, then paste the prompted
  env values from `.env`). Vercel is not recommended for the API (it is a
  long-running server, not serverless functions).
- **Web** — `apps/web` deploys to Vercel natively (root directory
  `apps/web`); set the `NEXT_PUBLIC_*` env vars and point
  `NEXT_PUBLIC_API_URL` at the deployed API.
- **Database/Auth** — already on Supabase Cloud; nothing to deploy.
