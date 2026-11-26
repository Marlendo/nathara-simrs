#!/usr/bin/env sh
set -eu
cd /app
echo "==> Menunggu PostgreSQL sentral (staging-postgres-18)..."
POSTGRES_HOST="${POSTGRES_HOST:-staging-postgres-18}"
POSTGRES_PORT="${POSTGRES_PORT:-5432}"
POSTGRES_USER="${POSTGRES_USER:-simrs_app}"
POSTGRES_DB="${POSTGRES_DB:-simrs}"
MAX_ATTEMPTS="${MAX_ATTEMPTS:-60}"
SLEEP_SECONDS="${SLEEP_SECONDS:-2}"
attempt=1
while [ "$attempt" -le "$MAX_ATTEMPTS" ]; do
  if node -e "
    const net = require('node:net');
    const socket = net.connect({ host: process.argv[1], port: Number(process.argv[2]) });
    socket.on('connect', () => { socket.end(); process.exit(0); });
    socket.on('error', () => process.exit(1));
  " "$POSTGRES_HOST" "$POSTGRES_PORT"; then
    echo "PostgreSQL sentral siap."
    break
  fi
  echo "  percobaan ${attempt}/${MAX_ATTEMPTS}..."
  attempt=$((attempt + 1))
  if [ "$attempt" -gt "$MAX_ATTEMPTS" ]; then echo "PostgreSQL sentral tidak siap — STOP + eskalasi." >&2; exit 1; fi
  sleep "$SLEEP_SECONDS"
done
export DATABASE_URL="${DATABASE_URL:?DATABASE_URL sentral wajib (simrs/simrs_app via ~/staging/docker/.env)}"
echo "==> prisma generate (lokal workspace prisma 6 via @simrs/db — DILARANG bun x prisma)"
bun --filter @simrs/db db:generate
echo "==> prisma migrate deploy (TANPA seed — db:seed DILARANG)"
bun --filter @simrs/db db:migrate:deploy
echo "==> Migrasi selesai (seed demo DILARANG)."
