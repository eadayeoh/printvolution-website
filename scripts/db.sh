#!/usr/bin/env bash
# Quick wrapper for psql against the linked Supabase project.
# Usage:
#   ./scripts/db.sh -c "select count(*) from products;"
#   ./scripts/db.sh -f supabase/migrations/0002_seed.sql
#
# Requires: libpq (brew install libpq) and DB_URL exported or in .env.local

set -e

if [ -z "$SUPABASE_DB_URL" ]; then
  if [ -f .env.local ]; then
    set -a; source .env.local; set +a
  fi
fi

if [ -z "$SUPABASE_DB_URL" ]; then
  echo "ERROR: Set SUPABASE_DB_URL in .env.local or export it." >&2
  exit 1
fi

PSQL="/opt/homebrew/opt/libpq/bin/psql"
if [ ! -x "$PSQL" ]; then
  PSQL="$(which psql 2>/dev/null || echo psql)"
fi

"$PSQL" "$SUPABASE_DB_URL" "$@"
