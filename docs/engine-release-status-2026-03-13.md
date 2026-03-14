# Engine Release Status — 2026-03-13

## Executed now
- ✅ `SKIP_PROVIDER_HEALTH=1 npm run smoke:postdeploy`
  - build check passed
  - smoke script completed
- ✅ `npm run smoke:postdeploy` (provider health 포함) passed
  - `/health` ok: `http://localhost:8081/health`
- ✅ backend unit tests passed
  - `PYTHONPATH=backend/provider-python python3 -m pytest -q backend/provider-python/app/tests/test_compatibility_service.py backend/provider-python/app/tests/test_chart_service.py`
  - result: `8 passed`

## Fixes applied during verification
1. `backend/provider-python/app/config.py`
   - dataclass mutable default(list) 에러 수정
   - `cors_allow_origins`를 `field(default_factory=...)`로 변경
2. Python test/runtime dependency 보강
   - host python에 `pytest`/provider deps 설치 후 검증 진행

## Additional verification (2026-03-14)
- ✅ provider health: `GET /health` ok
- ✅ smoke 재실행: `npm run smoke:postdeploy` passed
- ✅ 샘플 호출 기반 메트릭 스냅샷(로컬 provider)
  - chart 20회
    - `calculationSource`: `mock` 20
    - `ruleVersion`: `v1-current` 20
    - warnings: `PROVIDER_PARTIAL_DATA` 10
  - compatibility 20회
    - score range: 57~71
    - warnings: `PROVIDER_PARTIAL_DATA` 16

## Remaining to fully close "real engine attach" work
1. 운영 환경에서 `CHART_ENGINE_MODE=lunar-prep` + `CHART_RULE_VERSION=v2-month-branch-boost` 적용 확인
2. 프론트 런타임 지표(non-provider ratio, warning aggregation) 실서비스 트래픽 기준 확인
3. 운영 배포 환경에서도 동일 스모크 재검증
