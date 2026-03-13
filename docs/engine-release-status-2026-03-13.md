# Engine Release Status — 2026-03-13

## Executed now
- ✅ `SKIP_PROVIDER_HEALTH=1 npm run smoke:postdeploy`
  - build check passed
  - smoke script completed
- ⚠️ `npm run smoke:postdeploy` (provider health 포함) failed
  - reason: `http://localhost:8081/health` connection failed (provider not running)
- ⚠️ backend unit test run blocked
  - `python3 -m pytest -q backend/provider-python/app/tests/test_compatibility_service.py`
  - reason: `No module named pytest`

## Remaining to fully close "real engine attach" work
1. Bring up provider runtime and pass `/health`
2. Re-run full smoke with provider health enabled
3. Install backend test deps and run compatibility/chart tests
4. Verify release checklist metrics in runtime logs
   - provider success ratio
   - non-provider ratio
   - warning code aggregation

## Suggested next commands
```bash
# provider 실행 (예시)
cd backend/provider-python
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 8081

# in repo root
npm run smoke:postdeploy
```
