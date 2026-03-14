#!/usr/bin/env bash
set -euo pipefail

BASE_URL="${1:-${VITE_SAJU_PROVIDER_BASE_URL:-}}"
if [[ -z "${BASE_URL}" ]]; then
  echo "usage: $0 <provider_base_url>"
  echo "or set VITE_SAJU_PROVIDER_BASE_URL"
  exit 1
fi

EXPECTED_MODE="${EXPECTED_MODE:-lunar-prep}"
EXPECTED_RULE="${EXPECTED_RULE:-v2-month-branch-boost}"
EXPECTED_SOURCE="${EXPECTED_SOURCE:-provider-lunar-python}"
if [[ "$EXPECTED_MODE" == "fake" && -z "${EXPECTED_SOURCE_OVERRIDE:-}" ]]; then
  EXPECTED_SOURCE="mock"
fi

echo "[check] health: ${BASE_URL}/health"
HEALTH_JSON="$(curl -fsS "${BASE_URL%/}/health")"
echo "$HEALTH_JSON"

MODE="$(python3 - <<'PY' "$HEALTH_JSON"
import json,sys
j=json.loads(sys.argv[1])
print(j.get('mode',''))
PY
)"

if [[ "$MODE" != "$EXPECTED_MODE" ]]; then
  echo "[fail] mode mismatch: got=$MODE expected=$EXPECTED_MODE"
  exit 2
fi

echo "[check] sample /saju/chart ruleVersion"
CHART_JSON="$(curl -fsS -X POST "${BASE_URL%/}/saju/chart" \
  -H 'content-type: application/json' \
  -d '{"person":{"name":"healthcheck","birthDate":"1993-07-21","birthTime":"14:20","birthTimeKnown":true,"gender":"male","calendarType":"solar","timezone":"Asia/Seoul"},"options":{"includeSignals":true,"includeRawPillars":true}}')"

python3 - <<'PY' "$CHART_JSON"
import json,sys
j=json.loads(sys.argv[1])
rv=j.get('saju',{}).get('ruleVersion')
src=j.get('saju',{}).get('calculationSource')
warn=j.get('warnings',[])
print(f"ruleVersion={rv}")
print(f"calculationSource={src}")
print(f"warnings={warn}")
PY

RULE="$(python3 - <<'PY' "$CHART_JSON"
import json,sys
j=json.loads(sys.argv[1])
print(j.get('saju',{}).get('ruleVersion',''))
PY
)"
SRC="$(python3 - <<'PY' "$CHART_JSON"
import json,sys
j=json.loads(sys.argv[1])
print(j.get('saju',{}).get('calculationSource',''))
PY
)"

if [[ "$RULE" != "$EXPECTED_RULE" ]]; then
  echo "[fail] ruleVersion mismatch: got=$RULE expected=$EXPECTED_RULE"
  exit 3
fi

if [[ "$SRC" != "$EXPECTED_SOURCE" ]]; then
  echo "[fail] source mismatch: got=$SRC expected=$EXPECTED_SOURCE"
  exit 4
fi

echo "[ok] provider mode/rule/source all matched"
