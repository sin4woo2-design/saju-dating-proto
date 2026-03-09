# Python Provider API Spec (Draft v0)

목표: lunar-python 실연동 전, 프론트(C안)와 붙을 **내부 API 계약**을 먼저 확정한다.

Base URL (예시)
- `http://localhost:8081`

공통
- Content-Type: `application/json`
- Timeout 권장: 1500ms (프론트 adapter 기준)
- 모든 성공 응답에 `meta.requestId` 포함

---

## 1) POST /saju/chart

설명
- 개인 사주 원시 계산값(오행/사주기둥/신호) 반환

Request JSON
```json
{
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
}
```

Success Response JSON
```json
{
  "meta": {
    "providerVersion": "fake-python-provider-v0",
    "requestId": "req_01JXYZ...",
    "latencyMs": 42
  },
  "saju": {
    "fiveElements": {
      "wood": 61,
      "fire": 47,
      "earth": 52,
      "metal": 38,
      "water": 64
    },
    "pillars": {
      "year": "辛未",
      "month": "甲戌",
      "day": "丁丑",
      "hour": "丙午"
    },
    "signals": ["WOOD_STRONG", "WATER_SUPPORT"]
  },
  "warnings": ["PROVIDER_PARTIAL_DATA"]
}
```

---

## 2) POST /saju/compatibility-signals

설명
- 두 사람의 궁합 원시 신호 + 점수(있으면) 반환
- 점수 미반환도 허용(프론트 파생 점수 사용)
- 현재 fake provider는 signals 기반 임시 규칙으로 score를 파생함

Request JSON
```json
{
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
}
```

Success Response JSON
```json
{
  "meta": {
    "providerVersion": "fake-python-provider-v0",
    "requestId": "req_01JXYZ...",
    "latencyMs": 58
  },
  "compatibility": {
    "score": 84,
    "signals": ["HAP_YEAR_BRANCH", "CHUNG_DAY_STEM"]
  },
  "warnings": []
}
```

점수 미반환(Response 허용 예)
```json
{
  "meta": {
    "providerVersion": "fake-python-provider-v0",
    "requestId": "req_01JXYZ..."
  },
  "compatibility": {
    "signals": ["HAP_YEAR_BRANCH"]
  },
  "warnings": ["PROVIDER_PARTIAL_DATA"]
}
```

---

## 3) 정책 결정

### 3.1 timezone
- 기본: `Asia/Seoul`
- 허용: `UTC` (테스트/이관용)
- 그 외 timezone 수신 시: 400 + `UNSUPPORTED_TIMEZONE`

### 3.2 birthTime 미상
- 클라이언트는 `birthTime="12:00"` 전달
- 반드시 `birthTimeKnown=false` 동시 전달
- provider는 `PROVIDER_PARTIAL_DATA` warning 부여 가능

### 3.3 solar/lunar
- 요청 필드로 `calendarType` 받음
- v0 fake provider는 `solar` 우선 지원
- `lunar` 미지원 상태면 400 + `UNSUPPORTED_CALENDAR_TYPE`

---

## 4) warning / error / timeout 정책

Warning Code
- `PROVIDER_TIMEOUT`
- `PROVIDER_UNAVAILABLE`
- `PROVIDER_BAD_RESPONSE`
- `PROVIDER_PARTIAL_DATA`

Error Response (HTTP 4xx/5xx)
```json
{
  "error": {
    "code": "INVALID_INPUT",
    "message": "birthDate must be YYYY-MM-DD",
    "requestId": "req_01JXYZ...",
    "retryable": false
  }
}
```

Timeout
- Provider가 SLA(예: 1200ms) 넘기면 서버는 504 `UPSTREAM_TIMEOUT`
- 프론트 adapter는 이를 `PROVIDER_TIMEOUT`으로 변환하고 fallback 수행

---

## 5) 프론트 매핑 포인트

연결 파일
- `src/lib/engine/provider-contract.ts`
- `src/lib/engine/providerMapping.ts`

매핑 규칙
- `/saju/chart` → `ProviderSajuResponse` → `mapProviderSajuResponseToProfile()`
- `/saju/compatibility-signals` → `ProviderCompatibilityResponse` → `mapProviderCompatibilityToScore()`
- 누락값은 기존 규칙대로 보간(default) + warnings

---

## 6) fake Python provider 구조(초안)

권장 폴더
- `backend/provider-python/`
  - `README.md`
  - `app/main.py` (FastAPI entry)
  - `app/schemas.py` (pydantic req/res)
  - `app/routes/saju.py` (`/saju/chart`, `/saju/compatibility-signals`)
  - `app/services/fake_engine.py` (deterministic mock 계산)
  - `app/services/request_id.py`
  - `app/tests/test_saju_routes.py`
  - `requirements.txt`

주의
- 이번 턴에서는 구조/계약만 확정하고, 실제 실행 코드 구현은 다음 단계에서 진행
