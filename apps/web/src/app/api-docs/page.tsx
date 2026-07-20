'use client';
import Link from 'next/link';
import { Copy } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';
const KEY_PLACEHOLDER = 'dbk_YOUR_API_KEY';

type Method = 'GET' | 'POST' | 'PATCH' | 'DELETE';

interface Endpoint {
  method: Method;
  path: string;
  title: string;
  description: string;
  auth: 'api-key' | 'session' | 'none';
  body?: object;
}

const sections: { heading: string; blurb?: string; endpoints: Endpoint[] }[] = [
  {
    heading: 'Health',
    endpoints: [
      {
        method: 'GET',
        path: '/health',
        title: 'Health check',
        description: 'Reports API and database status. No authentication required.',
        auth: 'none',
      },
    ],
  },
  {
    heading: 'Documents',
    blurb:
      'Documents are chunked and embedded on create/update so the chat endpoint can retrieve them. All routes are scoped to the authenticated user.',
    endpoints: [
      {
        method: 'GET',
        path: '/documents',
        title: 'List documents',
        description: 'Returns all of your documents, most recently updated first.',
        auth: 'api-key',
      },
      {
        method: 'GET',
        path: '/documents/:id',
        title: 'Get a document',
        description: 'Returns a single document by id.',
        auth: 'api-key',
      },
      {
        method: 'POST',
        path: '/documents',
        title: 'Create a document',
        description:
          'Creates a document and indexes it for retrieval. title: 1–500 chars. content: up to 1M chars. tags: optional, max 50 tags of 50 chars each.',
        auth: 'api-key',
        body: {
          title: 'Onboarding runbook',
          content: 'Full document text…',
          tags: ['process', 'internal'],
        },
      },
      {
        method: 'PATCH',
        path: '/documents/:id',
        title: 'Update a document',
        description:
          'Same fields as create, all optional. Content changes are re-indexed atomically — readers never see a half-updated document.',
        auth: 'api-key',
        body: { title: 'New title' },
      },
      {
        method: 'DELETE',
        path: '/documents/:id',
        title: 'Delete a document',
        description: 'Removes the document and its embeddings. Returns 204 No Content.',
        auth: 'api-key',
      },
    ],
  },
  {
    heading: 'Conversations & chat',
    blurb:
      'POST /chat runs the full RAG pipeline: your question is embedded, the most relevant chunks of your documents are retrieved, and the answer is grounded in them with citations. Omit conversationId to start a new conversation — the response includes it for follow-ups.',
    endpoints: [
      {
        method: 'POST',
        path: '/chat',
        title: 'Ask a question',
        description:
          'message: 1–8000 chars. conversationId: optional UUID of an existing conversation. The response contains the answer, citations back to your documents, and the conversationId.',
        auth: 'api-key',
        body: { message: 'What did I write about onboarding?' },
      },
      {
        method: 'POST',
        path: '/chat/stream',
        title: 'Ask a question (streaming)',
        description:
          'Same inputs as /chat, but streams the answer token-by-token as Server-Sent Events (one JSON ChatStreamEvent per data: frame: meta → delta… → done). The web app uses this; add `-N` to curl to see tokens arrive live.',
        auth: 'api-key',
        body: { message: 'What did I write about onboarding?' },
      },
      {
        method: 'GET',
        path: '/conversations',
        title: 'List conversations',
        description: 'Returns your conversations, most recent first.',
        auth: 'api-key',
      },
      {
        method: 'POST',
        path: '/conversations',
        title: 'Create a conversation',
        description: 'Optionally pass a title (max 200 chars). POST /chat creates one automatically if you skip this.',
        auth: 'api-key',
        body: { title: 'Support questions' },
      },
      {
        method: 'GET',
        path: '/conversations/:id/messages',
        title: 'Get messages',
        description: 'Returns the full message history of a conversation.',
        auth: 'api-key',
      },
      {
        method: 'DELETE',
        path: '/conversations/:id',
        title: 'Delete a conversation',
        description: 'Removes the conversation and its messages. Returns 204 No Content.',
        auth: 'api-key',
      },
    ],
  },
  {
    heading: 'API keys',
    blurb:
      'Key management requires a logged-in session (Bearer token) — an API key can never create or revoke keys. Create and revoke keys in the app under Settings → API.',
    endpoints: [
      {
        method: 'GET',
        path: '/api-keys',
        title: 'List your API keys',
        description: 'Returns key metadata (name, prefix, dates). The secret is never returned.',
        auth: 'session',
      },
      {
        method: 'POST',
        path: '/api-keys',
        title: 'Create an API key',
        description:
          'name: optional, max 100 chars. The full key is returned once in this response and never again.',
        auth: 'session',
        body: { name: 'Bubble app' },
      },
      {
        method: 'DELETE',
        path: '/api-keys/:id',
        title: 'Revoke an API key',
        description: 'The key stops working immediately. Returns 204 No Content.',
        auth: 'session',
      },
    ],
  },
];

const methodStyles: Record<Method, string> = {
  GET: 'bg-emerald-100 text-emerald-800',
  POST: 'bg-sky-100 text-sky-800',
  PATCH: 'bg-amber-100 text-amber-800',
  DELETE: 'bg-rose-100 text-rose-800',
};

function buildCurl(e: Endpoint): string {
  const lines = [`curl -X ${e.method} ${API_URL}${e.path.replace(':id', '<id>')}`];
  if (e.auth === 'api-key') lines.push(`  -H "X-API-Key: ${KEY_PLACEHOLDER}"`);
  if (e.auth === 'session') lines.push('  -H "Authorization: Bearer <supabase_access_token>"');
  if (e.body) {
    lines.push('  -H "Content-Type: application/json"');
    lines.push(`  -d '${JSON.stringify(e.body)}'`);
  }
  return lines.join(' \\\n');
}

function CurlBlock({ endpoint }: { endpoint: Endpoint }) {
  const curl = buildCurl(endpoint);

  async function copy() {
    await navigator.clipboard.writeText(curl);
    toast.success('cURL copied');
  }

  return (
    <div className="relative mt-3">
      <pre className="overflow-x-auto rounded-lg bg-foreground/[0.04] p-4 pr-14 font-mono text-xs leading-relaxed">
        {curl}
      </pre>
      <Button
        variant="outline"
        size="sm"
        onClick={copy}
        aria-label="Copy cURL"
        className="absolute right-2 top-2 gap-1.5 bg-card px-2.5"
      >
        <Copy className="h-3.5 w-3.5" />
        Copy
      </Button>
    </div>
  );
}

export default function ApiDocsPage() {
  return (
    <div className="min-h-screen">
      <header className="border-b border-border bg-card/60 px-6 py-4">
        <div className="mx-auto flex max-w-4xl items-center justify-between">
          <Link href="/" className="font-serif text-2xl font-semibold tracking-tight">
            DocBrain
          </Link>
          <span className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
            API reference
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-4xl px-6 py-10">
        <div className="mb-1 font-mono text-xs uppercase tracking-[0.2em] text-primary">
          Developers
        </div>
        <h1 className="font-serif text-3xl font-semibold">API documentation</h1>
        <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
          Call DocBrain from any HTTP client — a Bubble app via the API Connector, a script, or a
          server. Every response is JSON.
        </p>

        <section className="mt-8 rounded-xl border border-border bg-card p-5">
          <h2 className="font-serif text-xl font-semibold">Getting started</h2>
          <dl className="mt-3 space-y-3 text-sm">
            <div>
              <dt className="font-medium">Base URL</dt>
              <dd className="mt-1">
                <code className="rounded bg-secondary px-2 py-1 font-mono text-xs">{API_URL}</code>
              </dd>
            </div>
            <div>
              <dt className="font-medium">Authentication</dt>
              <dd className="mt-1 text-muted-foreground">
                Create a key under <span className="text-foreground">Settings → API</span> in the
                app, then send it on every request as{' '}
                <code className="rounded bg-secondary px-1.5 py-0.5 font-mono text-xs">
                  X-API-Key: dbk_…
                </code>
                . The key acts as your account: it reads and writes your documents and chats.
                (Alternatively, a Supabase session token works as{' '}
                <code className="rounded bg-secondary px-1.5 py-0.5 font-mono text-xs">
                  Authorization: Bearer …
                </code>
                .)
              </dd>
            </div>
            <div>
              <dt className="font-medium">Errors</dt>
              <dd className="mt-1 text-muted-foreground">
                Every error has the shape{' '}
                <code className="rounded bg-secondary px-1.5 py-0.5 font-mono text-xs">
                  {'{ statusCode, message, error, path, timestamp }'}
                </code>
                . 401 = missing/invalid credentials, 403 = not allowed, 404 = not yours or missing,
                400 = validation failure (unknown fields are rejected).
              </dd>
            </div>
            <div>
              <dt className="font-medium">Cold starts</dt>
              <dd className="mt-1 text-muted-foreground">
                On free-tier hosting the first request after ~15 idle minutes can take up to a
                minute while the server wakes. Subsequent requests are fast.
              </dd>
            </div>
          </dl>
        </section>

        {sections.map(({ heading, blurb, endpoints }) => (
          <section key={heading} className="mt-10">
            <h2 className="font-serif text-2xl font-semibold">{heading}</h2>
            {blurb && <p className="mt-2 max-w-2xl text-sm text-muted-foreground">{blurb}</p>}
            <div className="mt-4 space-y-4">
              {endpoints.map((e) => (
                <article
                  key={`${e.method} ${e.path}`}
                  className="rounded-xl border border-border bg-card p-5"
                >
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={cn(
                        'rounded-md px-2 py-0.5 font-mono text-xs font-semibold',
                        methodStyles[e.method],
                      )}
                    >
                      {e.method}
                    </span>
                    <code className="font-mono text-sm font-medium">{e.path}</code>
                    {e.auth === 'session' && (
                      <span className="rounded-full border border-border px-2 py-0.5 text-[11px] text-muted-foreground">
                        session only
                      </span>
                    )}
                    {e.auth === 'none' && (
                      <span className="rounded-full border border-border px-2 py-0.5 text-[11px] text-muted-foreground">
                        no auth
                      </span>
                    )}
                  </div>
                  <h3 className="mt-2 text-sm font-semibold">{e.title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{e.description}</p>
                  <CurlBlock endpoint={e} />
                </article>
              ))}
            </div>
          </section>
        ))}

        <footer className="mt-12 border-t border-border pt-6 text-sm text-muted-foreground">
          Need a key?{' '}
          <Link href="/settings" className="text-primary underline-offset-4 hover:underline">
            Settings → API
          </Link>
          .
        </footer>
      </main>
    </div>
  );
}
