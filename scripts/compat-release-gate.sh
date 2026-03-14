#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

echo "[compat-gate] provider tests"
PYTHONPATH=backend/provider-python python3 -m pytest -q \
  backend/provider-python/app/tests/test_compatibility_golden_cases.py \
  backend/provider-python/app/tests/test_compatibility_service.py \
  backend/provider-python/app/tests/test_chart_service.py

echo "[compat-gate] distribution report"
PYTHONPATH=backend/provider-python python3 backend/provider-python/scripts/compatibility-distribution-report.py

echo "[compat-gate] frontend build"
npm run -s build >/dev/null

echo "[compat-gate] smoke"
VITE_SAJU_PROVIDER_BASE_URL="${VITE_SAJU_PROVIDER_BASE_URL:-http://127.0.0.1:8081}" npm run -s smoke:postdeploy >/dev/null

echo "[compat-gate] done"
