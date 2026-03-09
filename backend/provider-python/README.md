# provider-python (fake server)

lunar-python 실연동 전 단계의 **FastAPI fake provider 서버**입니다.

## 포함된 엔드포인트
- `POST /saju/chart`
- `POST /saju/compatibility-signals`
- `GET /health`

API 계약 기준 문서:
- `docs/python-provider-api-spec.md`

## 실행 방법

```bash
cd backend/provider-python
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --host 0.0.0.0 --port 8081 --reload
```

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
  - lunar 엔진 진입을 시도하되(현재 미구현), 실패 시 fake로 fallback
  - fallback 시 warning에 `PROVIDER_UNAVAILABLE`가 포함될 수 있음

## deterministic fake 계산
- 동일 입력(payload)이면 동일 결과를 반환
- `requestId`, `latencyMs`, 계산 결과(오행/신호)가 입력 해시 기반으로 고정됨
- 궁합 점수는 임시로 signals 기반 파생 규칙으로 계산됨

## 범위
- 현재는 fake 로직만 구현됨
- 아직 lunar-python 설치/실연동은 하지 않음
