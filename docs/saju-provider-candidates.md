# 사주 Real Provider 후보 비교 (C안 기준)

> 범위: 실제 설치/연동 없이 조사·비교·추천만 수행
> 기준 문서: `docs/saju-real-provider-spec.md`

## 1) 현재 스펙 기준 필수 조건

- 입력
  - `birthDate(YYYY-MM-DD)`, `birthTime(HH:mm)`, `gender`, `timezone`
  - 가능하면 `calendarType(solar/lunar)` 확장 여지
- 출력
  - 최소: 오행 분포(wood/fire/earth/metal/water), 사주 기둥(연/월/일/시) 또는 동등 지표
  - 궁합 점수 계산 원천 신호(합/충/형/파/해 등)를 도출할 수 있는 데이터
- 운영
  - 안정적 응답 시간(모바일 UX 기준), 장애 시 fallback 허용
  - 버전/문서/유지보수 신뢰성

---

## 2) 후보 목록 (2~3개)

1. **lunar-python (6tail 계열, Python) + 자체 API 래핑**
2. **lunar-javascript / lunar-typescript (6tail 계열, JS/TS) + 내부 provider 모듈화**
3. **Prokerala Astrology API (Vedic 중심, 외부 SaaS API)**

> 주의: 1·2는 "라이브러리 기반 self-hosted provider", 3은 "외부 API provider" 성격.

---

## 3) 비교표

| 기준 | 후보 1: lunar-python + API | 후보 2: lunar-js/ts | 후보 3: Prokerala Astrology API |
|---|---|---|---|
| 입력 가능 범위 | 생년월일/시간/절기/간지 계산 유연 | 생년월일/시간/간지 계산 가능 | 출생정보 입력 가능(베다 점성 기준) |
| 반환 데이터 구조 | 팔자/오행/십성 등 원시값 구성 유리 | 팔자/오행 계산 가능, 앱 내 가공 용이 | API 응답 스키마 명확, 다만 동양 명리와 표현 차이 |
| 사주/만세력 적합성 | **높음** (동아시아 명리 로직 친화) | **중~높음** (같은 계열이나 정확도 검증 필요) | **중~낮음** (베다 점성 중심, 사주와 체계 다름) |
| 한국 사용자 정확도/활용성 | **높음** (사주 문맥에 맞추기 좋음) | 중~높음 | 중간 (현지화 해석 추가 필요) |
| 응답 속도 | 자체 서버 성능에 좌우, 캐시 가능 | 앱/서버 내 실행으로 빠름 | 외부 API 네트워크 의존 |
| 가격/호출 제한 | 라이선스/인프라 비용 중심 | 라이선스/인프라 비용 중심 | 요금제/호출 제한 정책 영향 큼 |
| 문서 품질/유지보수 리스크 | 오픈소스 문서 중심, 버전 고정 필요 | 오픈소스 문서 중심, 타입 안정성 점검 필요 | 상용 문서/지원 강점, 벤더 락인 리스크 |
| C안 적합성(핵심 계산 분리) | **매우 높음** | 높음 | 중간 |

---

## 4) 추천안 (1개)

## 추천: **후보 1 (lunar-python + 자체 API 래핑)**

### 추천 이유
1. 현재 spec이 요구하는 "원시 계산값 + 앱 측 해석" 분리에 가장 잘 맞음
2. 사주/만세력 문맥(절기/간지/오행) 정합성이 높아 한국 사용자 대상 서비스에 유리
3. C안(핵심 계산 API화, UI/문구는 TS 유지) 구조와 자연스럽게 결합됨
4. 추후 궁합 신호(합/충/형/파/해) 확장 시 데이터 소스 일관성 유지가 쉬움

---

## 5) 현재 spec과 충돌/보완 필요점

1. **timezone 기본값**
   - 현재 spec은 `UTC | Asia/Seoul` 병기
   - 사주 정확도 관점에서 기본은 `Asia/Seoul` 고정이 안전
2. **calendarType**
   - 현재 `solar` 고정
   - 실제 운영은 `solar` 입력 + 내부 음력/절기 변환 정책 명시 필요
3. **compatibility score**
   - provider가 점수를 직접 주지 않을 수 있음
   - spec에 "원시 신호 기반 앱 내부 스코어링 허용"을 명확히 추가 필요
4. **meta.requestId/latencyMs**
   - 라이브러리 기반 provider는 원래 없는 값이므로 adapter에서 생성 규칙 필요

---

## 6) 추천 후보 adapter 구현 계획 초안 (구현은 다음 턴)

1. `providerAdapter.ts`
   - `PythonHttpProviderAdapter` 인터페이스 준수 클래스 추가
   - timeout/retry/backoff 정책 삽입
2. `provider-contract.ts`
   - provider raw 응답 스키마 버전 필드 유지
3. `providerMapping.ts`
   - 원시 오행/간지/신호 -> App Domain 매핑 함수 분리
   - partial data 보간 정책 유지
4. `realEngineProvider.ts` (추후 생성)
   - `SajuEngine` 인터페이스 구현
   - 실패 시 mock fallback + warning 코드 부여
5. 테스트
   - contract test: 성공/partial/timeout/bad response
   - integration test: MySaju/Compatibility 렌더 무중단

---

## 7) 최종 의사결정 제안

- 1차 채택: **후보 1 (lunar-python + API 래핑)**
- 백업 경로: 후보 2 (JS/TS 내장형)
- 제외 권고: 후보 3 (사주 도메인 정합성 리스크가 큼)
