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

## Remaining to fully close "real engine attach" work
1. Verify release checklist metrics in runtime logs
   - provider success ratio
   - non-provider ratio
   - warning code aggregation
2. 운영 배포 환경에서도 동일 스모크 재검증
