#!/usr/bin/env bash
# =============================================================================
# AI Knowledge Base — one-command developer setup
# Usage: ./setup.sh
# =============================================================================
set -euo pipefail

cyan()  { printf "\033[36m%s\033[0m\n" "$1"; }
green() { printf "\033[32m%s\033[0m\n" "$1"; }
yellow(){ printf "\033[33m%s\033[0m\n" "$1"; }
red()   { printf "\033[31m%s\033[0m\n" "$1"; }

cyan "=============================================="
cyan " AI Knowledge Base — setup"
cyan "=============================================="

# 1. Tooling checks ----------------------------------------------------------
command -v node >/dev/null 2>&1 || { red "Node.js is required (>=22). Aborting."; exit 1; }
NODE_MAJOR="$(node -p 'process.versions.node.split(".")[0]')"
if [ "$NODE_MAJOR" -lt 22 ]; then
  red "Node >=22 required (found $(node -v)). Aborting."; exit 1
fi
green "✓ Node $(node -v)"

if ! command -v pnpm >/dev/null 2>&1; then
  yellow "pnpm not found — enabling via corepack..."
  corepack enable
  corepack prepare pnpm@10.30.2 --activate
fi
green "✓ pnpm $(pnpm -v)"

# 2. Install deps ------------------------------------------------------------
cyan "→ Installing dependencies (pnpm install)..."
pnpm install

# 3. Env file ----------------------------------------------------------------
if [ ! -f .env ]; then
  cp .env.example .env
  green "✓ Created .env from .env.example"
  yellow "  ACTION REQUIRED: edit .env and fill in Supabase + AI provider values."
else
  green "✓ .env already exists (left untouched)"
fi

# 4. Supabase migrations (skipped until linked) ------------------------------
if command -v supabase >/dev/null 2>&1; then
  if supabase projects list >/dev/null 2>&1; then
    cyan "→ Pushing migrations to linked Supabase project..."
    pnpm db:push || yellow "  (db:push skipped — link a project first: supabase link)"
  else
    yellow "→ Supabase CLI found but not logged in. Run: supabase login && supabase link"
  fi
else
  yellow "→ Supabase CLI not installed. Migrations will run in Phase 2."
  yellow "  Install: https://supabase.com/docs/guides/cli"
fi

# 5. Next steps --------------------------------------------------------------
green ""
green "=============================================="
green " Setup complete."
green "=============================================="
cat <<'NEXT'

Next steps:
  1. Edit .env with your Supabase URL/keys and AI provider key.
  2. (Phase 2+) Link Supabase and push migrations:  supabase link && pnpm db:push
  3. Start everything:                               pnpm dev
     - web  -> http://localhost:3000
     - api  -> http://localhost:3001/health

Useful commands:
  pnpm build        build all workspaces
  pnpm lint         lint all workspaces
  pnpm type-check   typecheck all workspaces
  pnpm format       prettier write

NEXT
