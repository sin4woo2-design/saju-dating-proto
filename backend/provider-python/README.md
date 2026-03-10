# provider-python (fake server)

lunar-python 실연동 전 단계의 **FastAPI fake provider 서버**입니다.

## 포함된 엔드포인트
- `POST /saju/chart`
- `POST /saju/compatibility-signals`
- `GET /health`

API 계약 기준 문서:
- `docs/python-provider-api-spec.md`

## 실행 방법 (개발)

```bash
cd backend/provider-python
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
# real chart 준비 모드
export CHART_ENGINE_MODE=lunar-prep
uvicorn app.main:app --host 0.0.0.0 --port 8081 --reload
```

## 상시 실행 (VM / systemd)
- 서비스 유닛: `deploy/systemd/saju-provider.service`
- 환경변수 파일: `deploy/env/provider.env`
- 실행 스크립트: `scripts/run-provider.sh`

상세 절차는 `docs/provider-vm-vercel-deployment.md` 참고.

서버 확인:
```bash
curl http://localhost:8081/health
```

## curl 예시

### 1) /saju/chart
```bash
curl -s -X POST http://localhost:8081/saju/chart \
  -H "Content-Type: application/json" \
  -d '{
    "person": {
      "name": "홍길동",
      "birthDate": "1991-10-21",
      "birthTime": "12:00",
      "birthTimeKnown": false,
      "gender": "male",
      "calendarType": "solar",
      "timezone": "Asia/Seoul"
    },
    "options": {
      "includeSignals": true,
      "includeRawPillars": true
    }
  }'
```

### 2) /saju/compatibility-signals
```bash
curl -s -X POST http://localhost:8081/saju/compatibility-signals \
  -H "Content-Type: application/json" \
  -d '{
    "me": {
      "birthDate": "1991-10-21",
      "birthTime": "08:30",
      "birthTimeKnown": true,
      "gender": "male",
      "calendarType": "solar",
      "timezone": "Asia/Seoul"
    },
    "partner": {
      "birthDate": "1993-02-11",
      "birthTime": "12:00",
      "birthTimeKnown": false,
      "gender": "female",
      "calendarType": "solar",
      "timezone": "Asia/Seoul"
    },
    "options": {
      "includeSignals": true
    }
  }'
```

## 정책 반영 사항
- `timezone` 허용: `Asia/Seoul`, `UTC`
- `calendarType=lunar` 요청 시 400 + `UNSUPPORTED_CALENDAR_TYPE`
- `birthTimeKnown=false`이면 warning에 `PROVIDER_PARTIAL_DATA` 추가 가능

## 전환 준비 모드
- `CHART_ENGINE_MODE=fake` (기본)
- `CHART_ENGINE_MODE=lunar-prep`
  - lunar-python 계산 진입, 실패 시 fake로 fallback

추가 옵션
- `CORS_ALLOW_ORIGINS=http://localhost:5173,https://saju-dating-proto.vercel.app`
- `ENGINE_VERSION=chart-engine-v0.3`
- `CHART_RULE_VERSION=v2-month-branch-boost` (**chart baseline 잠정 고정**)
- `CHART_RULE_VERSION=v1-current` (롤백 기준, 검증용)
- `CHART_RULE_VERSION=exp-v2-hidden-blend` (월지강화+지장간 약식 혼합 실험)
- `CHART_HIDDEN_STEM_BLEND=0.5` (혼합안 가중치, 권장 0.4~0.6)
- `CHART_EARTH_DAMPENING_ENABLED=false` (overlap 상황 earth 감쇠 실험 플래그)
- `CHART_EARTH_DAMPENING_STRENGTH=0.5` (감쇠 강도)

`/saju/chart` 응답에는 추적 메타가 포함됩니다.
- `meta.providerVersion`
- `meta.engineVersion`
- `saju.ruleVersion`
- `saju.calculationSource`

## chart real 전환(최소 구현)
- `CHART_ENGINE_MODE=lunar-prep`일 때 `/saju/chart`는 lunar-python 계산 경로를 우선 사용
- 실패 시 자동으로 fake chart로 fallback (`PROVIDER_UNAVAILABLE` warning)
- `/saju/compatibility-signals`는 아직 fake signal + 파생 점수 유지

## deterministic fake 계산
- 동일 입력(payload)이면 동일 결과를 반환
- `requestId`, `latencyMs`, 계산 결과(오행/신호)가 입력 해시 기반으로 고정됨
- 궁합 점수는 임시로 signals 기반 파생 규칙으로 계산됨

## 간단 검증
```bash
# 로컬 smoke 테스트
python -m app.tests.test_chart_service
```

## 범위
- `/saju/chart`는 lunar-python 최소 구현 반영됨(모드: lunar-prep)
- `/saju/compatibility-signals`는 아직 fake 로직 유지
