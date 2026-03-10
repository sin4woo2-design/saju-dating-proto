#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
VENV_PYTHON="${ROOT_DIR}/.venv/bin/python"

if [ ! -x "$VENV_PYTHON" ]; then
  echo "[provider-python] missing venv python: $VENV_PYTHON" >&2
  echo "create venv first: cd ${ROOT_DIR} && python3 -m venv .venv && .venv/bin/pip install -r requirements.txt" >&2
  exit 1
fi

exec "$VENV_PYTHON" -m uvicorn app.main:app --host 127.0.0.1 --port 8081
