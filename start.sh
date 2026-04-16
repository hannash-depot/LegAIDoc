#!/usr/bin/env bash
# ============================================================
# LegAIDoc — Development Server Startup Script
# ============================================================
set -euo pipefail

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

PROJECT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$PROJECT_DIR"

log()  { echo -e "${BLUE}[LegAIDoc]${NC} $1"; }
ok()   { echo -e "${GREEN}  ✔${NC} $1"; }
warn() { echo -e "${YELLOW}  ⚠${NC} $1"; }
fail() { echo -e "${RED}  ✖${NC} $1"; exit 1; }

# ── Pre-flight checks ────────────────────────────────────────
log "Running pre-flight checks..."

command -v pnpm >/dev/null 2>&1   || fail "pnpm is not installed. Run: npm install -g pnpm"
command -v node >/dev/null 2>&1   || fail "Node.js is not installed."

NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
  fail "Node.js 18+ required. Current: $(node -v)"
fi
ok "Node $(node -v) / pnpm $(pnpm -v)"

# ── .env check ────────────────────────────────────────────────
if [ ! -f .env ]; then
  if [ -f .env.example ]; then
    cp .env.example .env
    warn "Created .env from .env.example — review and update secrets before production use."
  else
    fail "No .env file found. Create one with DATABASE_URL and AUTH_SECRET."
  fi
fi
ok ".env file present"

# ── Install dependencies ──────────────────────────────────────
if [ ! -d node_modules ]; then
  log "Installing dependencies..."
  pnpm install
else
  ok "Dependencies installed"
fi

# ── Start PostgreSQL (Docker — optional) ──────────────────────
if command -v docker >/dev/null 2>&1; then
  log "Starting PostgreSQL via Docker..."

  if docker ps --format '{{.Names}}' 2>/dev/null | grep -q 'legaidoc-db'; then
    ok "PostgreSQL already running (legaidoc-db)"
  else
    docker compose up -d postgres 2>/dev/null || docker-compose up -d postgres 2>/dev/null || warn "Could not start Docker Postgres"
    ok "PostgreSQL started"

    # Wait for PostgreSQL to be ready
    log "Waiting for PostgreSQL to accept connections..."
    RETRIES=15
    until docker exec legaidoc-db pg_isready -U legaidoc >/dev/null 2>&1 || [ $RETRIES -eq 0 ]; do
      RETRIES=$((RETRIES - 1))
      sleep 1
    done

    if [ $RETRIES -eq 0 ]; then
      warn "PostgreSQL did not respond in time — continuing anyway"
    else
      ok "PostgreSQL ready"
    fi
  fi
else
  warn "Docker not installed — skipping PostgreSQL startup."
  warn "Make sure DATABASE_URL in .env points to a running Postgres instance."
fi

# ── Prisma setup ──────────────────────────────────────────────
log "Syncing database schema..."
pnpm db:generate >/dev/null 2>&1
ok "Prisma client generated"

if pnpm db:push 2>/dev/null; then
  ok "Database schema synced"

  # ── Seed data ─────────────────────────────────────────────────
  log "Seeding database..."
  pnpm db:seed 2>/dev/null && ok "Seed data applied" || warn "Seed script had warnings (data may already exist)"
else
  warn "Could not sync database schema — is PostgreSQL running?"
  warn "Start PostgreSQL and run: pnpm db:push && pnpm db:seed"
fi

# ── Start dev server ──────────────────────────────────────────
echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}  LegAIDoc is starting on http://localhost:3000  ${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "  ${BLUE}App:${NC}      http://localhost:3000"
echo -e "  ${BLUE}Database:${NC} postgresql://localhost:5432/legaidoc"
echo -e "  ${BLUE}Studio:${NC}   Run ${YELLOW}pnpm db:studio${NC} in another terminal"
echo ""
echo -e "  Press ${YELLOW}Ctrl+C${NC} to stop the dev server."
echo -e "  Run ${YELLOW}docker compose down${NC} to stop PostgreSQL."
echo ""

exec pnpm dev
