# Real Engine Env Lock Verification (2026-03-14)

목적: `CHART_ENGINE_MODE`, `CHART_RULE_VERSION` 고정 시 chart가 실엔진 경로로 강제되는지 확인

## 검증 명령
```bash
CHART_ENGINE_MODE=lunar-prep \
CHART_RULE_VERSION=v2-month-branch-boost \
PYTHONPATH=backend/provider-python \
python3 - <<'PY'
from collections import Counter
from app.schemas import PersonInput
from app.services.chart_service import get_chart

samples=[PersonInput(name='t',birthDate='1993-07-21',birthTime='14:20',birthTimeKnown=True,gender='male') for _ in range(20)]
src=Counter();rule=Counter();warn=Counter()
for p in samples:
 r=get_chart(p); src[r['calculation_source']]+=1; rule[r['rule_version']]+=1
 for w in r.get('warnings',[]): warn[w]+=1
print('source',dict(src))
print('rule',dict(rule))
print('warnings',dict(warn))
PY
```

## 결과
- source: `provider-lunar-python` 20/20
- rule: `v2-month-branch-boost` 20/20
- warnings: 없음

## 해석
- 엔진 설정값이 적용되면 chart는 mock이 아닌 provider-lunar-python 경로를 정상 사용함.
- 현재 미해결은 **운영 환경 변수 실제 적용 여부 확인**이며, 코드/로컬 동작 자체는 기준 충족.

## 다음 단계
1. 운영 환경 변수 고정값 점검
2. 운영 스모크 재실행
3. 운영 트래픽 샘플(20회+)에서 source/rule/warning 비율 수집
