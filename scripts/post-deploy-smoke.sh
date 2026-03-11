#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

echo "[smoke] build check"
npm run -s build >/dev/null

if [[ "${SKIP_PROVIDER_HEALTH:-0}" == "1" ]]; then
  echo "[smoke] provider check skipped (SKIP_PROVIDER_HEALTH=1)"
else
  echo "[smoke] provider check"
  BASE_URL="${VITE_SAJU_PROVIDER_BASE_URL:-http://localhost:8081}"
  if curl -fsS "$BASE_URL/health" >/dev/null; then
    echo "[smoke] provider health ok: $BASE_URL"
  else
    echo "[smoke] provider health failed: $BASE_URL" >&2
    exit 1
  fi
fi

echo "[smoke] done"
