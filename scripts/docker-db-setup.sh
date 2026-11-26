#!/usr/bin/env bash
# Migrasi & seed di dalam container (dipanggil oleh docker compose profile setup).
set -euo pipefail

cd /workspace

export DATABASE_URL="${DATABASE_URL:-postgresql://simrs:simrs@postgres:5432/simrs?schema=public}"

echo "==> Install dependensi @simrs/db (bun-first)"
corepack enable
# [migrasi bun] corepack/pnpm DIHAPUS — gunakan bun
bun install --filter @simrs/db... --frozen-lockfile 2>/dev/null || bun install --filter @simrs/db...

echo "==> prisma generate"
bun --filter @simrs/db db:generate

echo "==> prisma migrate deploy"
bun --filter @simrs/db db:migrate

echo "==> prisma db seed"
bun --filter @simrs/db db:seed

echo "==> Database setup selesai."
