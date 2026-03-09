# 사주 Real Provider 연결 스펙 (C안)

## 0. 범위
- 이번 문서는 **provider 연결 계약/어댑터/실패정책 확정**이 목적이다.
- 실제 provider SDK 설치/구현/배포는 범위 밖이다.

## 1. 아키텍처 (C안)
- 계산 책임 분리:
  - Provider(API): 명리 핵심 계산값(오행, 궁합 점수, 근거 신호)
  - App(TS): 결과 해석 문구/UX 카드 구성/공유 문구 생성
- 내부 경로:
  1) UI 입력 (`UserProfileInput`)
  2) Engine Router (`src/lib/engine/index.ts`)
  3) Real Provider Adapter (추가 예정)
  4) Provider Raw Response
  5) Mapping Layer (`providerMapping.ts`)
  6) App Domain (`SajuProfile`, 궁합 점수)

## 2. 입력 계약

## 2.1 Saju 계산 요청
```ts
ProviderSajuRequest {
  person: {
    name?: string;
    birthDate: "YYYY-MM-DD";
    birthTime: "HH:mm"; // 모르면 "12:00"
    gender: "male" | "female" | "other";
    calendarType: "solar"; // 현재 앱 정책
    timezone: "UTC" | "Asia/Seoul"; // 초기값은 UTC, 운영 전 확정 필요
  };
  options?: {
    includeSignals?: boolean; // 근거 신호 포함 여부
    includeRawPillars?: boolean; // 천간지지 원문값 포함 여부
  };
}
```

## 2.2 궁합 계산 요청
```ts
ProviderCompatibilityRequest {
  me: ProviderSajuRequest["person"];
  partner: ProviderSajuRequest["person"];
  options?: {
    includeSignals?: boolean;
  };
}
```

## 3. 출력 계약

## 3.1 Saju 응답(원시)
```ts
ProviderSajuResponse {
  meta: {
    providerVersion: string;
    requestId: string;
    latencyMs?: number;
  };
  saju: {
    fiveElements?: Partial<Record<"wood" | "fire" | "earth" | "metal" | "water", number>>;
    pillars?: {
      year?: string;
      month?: string;
      day?: string;
      hour?: string;
    };
    signals?: string[];
  };
  warnings?: string[];
}
```

## 3.2 궁합 응답(원시)
```ts
ProviderCompatibilityResponse {
  meta: {
    providerVersion: string;
    requestId: string;
    latencyMs?: number;
  };
  compatibility: {
    score?: number; // 0~100 권장
    signals?: string[];
  };
  warnings?: string[];
}
```

## 4. 매핑 규칙 (Provider -> App)
- `fiveElements` 누락 키는 50으로 보간(default)
- element 수치 범위는 `0~100`으로 clamp
- 궁합 `score` 누락 시 fallback score(기본 72) + warning 추가
- provider 신호(`signals`)는 1차로 내부 `warnings`/추후 인사이트 카드 원천으로 저장
- App 해석 문구(성향/연애스타일/상대특징)는 현재 TS 규칙 유지

## 5. 실패 처리 정책

## 5.1 에러 분류
- `PROVIDER_TIMEOUT`
- `PROVIDER_UNAVAILABLE`
- `PROVIDER_BAD_RESPONSE`
- `PROVIDER_PARTIAL_DATA`

## 5.2 동작 원칙
1. 타임아웃/네트워크 실패: mock fallback + warning
2. 부분 데이터: 가능한 필드만 매핑 + 누락필드 default + warning
3. 응답 스키마 오류: mock fallback + warning
4. UI는 항상 결과를 받되, 내부적으로 `source`와 `warnings`를 남긴다.

## 6. 마이그레이션 TODO (mock -> real)
1. `providerAdapter.ts`에 실제 API 호출 구현
2. `realEngineStub.ts`를 `realEngineProvider.ts`로 교체
3. 엔진 모드 확장(`real-provider`) 및 env 분기 추가
4. 관측성 추가(requestId, latency, fallback rate)
5. 계약 테스트 + 통합 테스트 통과 후 점진 rollout

## 7. 검증 기준
- 동일 입력에 대해 provider 호출 실패 시에도 앱 렌더는 유지
- warnings 정책이 케이스별 정확히 부여됨
- 불완전 데이터 보간 시 타입 안정성 유지
- mock 모드 회귀 없음

## 8. Provider 후보/추천
- 후보 비교 문서: `docs/saju-provider-candidates.md`
- 1차 추천: `lunar-python + 자체 API 래핑`
- Python API 계약 문서: `docs/python-provider-api-spec.md`
- 보완 필요 정책:
  - timezone 기본값을 `Asia/Seoul`로 확정
  - provider 비점수 응답 시 앱 내부 score 파생 규칙 명시
