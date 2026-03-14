# Compatibility Real Engine 전환 체크리스트/설계안 (v1)

목표: 이번 문서는 **구현 착수 전 계약/기준 고정**이 목적이다.  
범위: compatibility(궁합) 도메인만 다룬다. UI 변경은 범위 밖.

---

## 1) 현재 compatibility의 real/fake 경계

### 현재 실제 동작 경계
- Front 엔진 모드: `real-provider` 기본
- 호출 엔드포인트: `POST /saju/compatibility-signals`
- Provider 응답: `score` + `rawSignals` + `reliability`(draft)
- Front 매핑(`mapProviderCompatibilityToScore`)은 **provider score보다 rawSignals 기반 파생 점수를 우선** 사용
  - score 규칙: `compat-v1-rawsignals`
  - base 70, clamp 40~96

### 아직 fake/준실 상태인 지점
- provider의 compatibility 계산은 실명리 full-rule이 아니라 **rule-table 기반 파생 계산**
- relation 범위가 제한적(연지/일간 중심), 월/일/시 교차 규칙·강약 보정은 제한
- front에서 최종 score를 재파생하므로 “provider authoritative score” 체계가 아직 아님

### 결론(현재 경계 요약)
- chart는 `provider-lunar-python`으로 실경로가 존재하나,
- compatibility는 아직 **raw signal 기반 준실 엔진 단계**이며,
- “실엔진 완전 전환”의 핵심은 **basis object + authoritative score 계약** 확정이다.

---

## 2) real compatibility engine 전환 목표 구조

## Target Principle
1. Provider가 궁합 계산의 **단일 계산 책임자(SSoT)**
2. Front는 해석/표시 책임(점수 재계산 최소화)
3. 응답은 score뿐 아니라 **basis/provenance/warnings/confidence**를 포함
4. fallback은 단계별 강등(degrade) 규칙으로 명확히 분리

## Target Flow
1) 입력 정규화(시간 미상, timezone, calendarType)
2) provider에서 chart basis 확보(양측 pillars + five elements + daymaster)
3) compatibility basis 계산(관계 신호, 가중치, 신뢰도 패널티)
4) `subScores` + `totalScore` 계산
5) `confidence` + `warnings` + `provenance` 첨부
6) Front는 수신값 렌더, 비상시만 로컬 fallback

---

## 3) compatibility basis object 설계안

아래는 provider 내부 계산 결과를 그대로 노출 가능한 basis object 제안이다.

```ts
interface CompatibilityBasisV1 {
  schemaVersion: "compat-basis-v1";

  participants: {
    me: {
      pillars?: { year?: string; month?: string; day?: string; hour?: string };
      dayMaster?: string; // 갑/을/병...
      fiveElements?: Partial<Record<"wood"|"fire"|"earth"|"metal"|"water", number>>;
      birthTimeKnown?: boolean;
    };
    partner: {
      pillars?: { year?: string; month?: string; day?: string; hour?: string };
      dayMaster?: string;
      fiveElements?: Partial<Record<"wood"|"fire"|"earth"|"metal"|"water", number>>;
      birthTimeKnown?: boolean;
    };
  };

  relations: {
    branchRelations: Array<{
      scope: "year"|"month"|"day"|"hour"|"cross";
      type: "hap"|"chung"|"hyeong"|"pa"|"hae"|"neutral";
      weight: number;
      code: string; // ex) BRANCH_HAP_YEAR
    }>;

    stemRelations: Array<{
      scope: "day"|"month"|"year"|"hour"|"cross";
      type: "hap"|"chung"|"clash"|"neutral";
      weight: number;
      code: string;
    }>;

    elementDynamics: Array<{
      type: "generates"|"controls"|"overweight"|"lacking"|"balanced";
      weight: number;
      code: string;
    }>;

    dayMasterDynamics: Array<{
      type: "support"|"clash"|"neutral";
      weight: number;
      code: string;
    }>;
  };

  reliability: {
    penalties: Array<{
      code: "RELIABILITY_TIME_UNKNOWN_ME" | "RELIABILITY_TIME_UNKNOWN_PARTNER" | "RELIABILITY_PARTIAL_PILLARS" | string;
      weight: number;
      reason: string;
    }>;
    confidence: "high" | "medium" | "low";
  };
}
```

설계 의도:
- rawSignals를 유지하되, 실제 계산 근거를 `relations` 계층으로 분해
- 추후 “왜 이 점수인가” 설명 가능(디버그/QA/법적 대응 포함)
- basis를 그대로 golden test fixture로 재사용 가능

---

## 4) provider 응답 계약안

현재 `ProviderCompatibilityResponse`를 아래와 같이 확장 제안:

```ts
interface ProviderCompatibilityResponseV2 {
  meta: {
    providerVersion: string;
    engineVersion?: string;
    requestId: string;
    latencyMs?: number;
  };

  compatibility: {
    totalScore: number; // authoritative score

    subScores: {
      branch: number;      // 0~100 정규화 또는 delta
      stem: number;
      elements: number;
      dayMaster: number;
      reliability: number; // penalty 축
    };

    basis: CompatibilityBasisV1;

    // 하위호환(점진 제거 대상)
    score?: number;
    signals?: string[];
    rawSignals?: Array<{
      code: string;
      category: "relation-branch" | "relation-stem" | "element-dynamics" | "daymaster-dynamics" | "reliability";
      polarity: "positive" | "negative" | "neutral";
      weight?: number;
      note?: string;
    }>;

    confidence: {
      level: "high" | "medium" | "low";
      reasons: string[];
    };

    provenance: {
      ruleVersion: string;        // ex) compat-v2-basis
      calculationSource: string;  // ex) provider-lunar-python
      basisSchemaVersion: "compat-basis-v1";
      chartRuleVersion?: string;  // 양측 chart 근거 버전
    };
  };

  warnings?: Array<
    | "PROVIDER_TIMEOUT"
    | "PROVIDER_UNAVAILABLE"
    | "PROVIDER_BAD_RESPONSE"
    | "PROVIDER_PARTIAL_DATA"
    | "COMPAT_RULE_DEGRADED"
    | "COMPAT_BASIS_INCOMPLETE"
  >;
}
```

계약 전환 원칙:
- v1: `score/rawSignals` 유지
- v2: `totalScore/subScores/basis/confidence/provenance` 추가
- v3: front가 안정화되면 `score/signals`를 deprecated 처리

---

## 5) fallback / warnings / confidence 전략

## Fallback 단계
1. **L0 정상**: provider v2 응답 완전 수신
2. **L1 부분 데이터**: basis 일부 누락 → `COMPAT_BASIS_INCOMPLETE`, 계산 지속
3. **L2 규칙 강등**: v2 불가 시 `compat-v1-rawsignals`로 강등 + `COMPAT_RULE_DEGRADED`
4. **L3 provider 실패**: mock-fallback + `FALLBACK_TO_MOCK_COMPATIBILITY`

## Warning 전략
- transport/infra: `PROVIDER_TIMEOUT`, `PROVIDER_UNAVAILABLE`
- schema: `PROVIDER_BAD_RESPONSE`
- data completeness: `PROVIDER_PARTIAL_DATA`, `COMPAT_BASIS_INCOMPLETE`
- calculation degrade: `COMPAT_RULE_DEGRADED`

## Confidence 산정 규칙(초안)
- 기본 high
- medium으로 강등:
  - 출생시간 한쪽 미상
  - month/day/hour 중 1개 이상 pillar 신뢰 낮음
- low로 강등:
  - 양측 시간 미상
  - 핵심 relation 축(branch/stem) 다수 누락
  - fallback L2/L3 진입

UI 연결 원칙(이번 문서 기준):
- 점수와 confidence를 항상 함께 노출
- low confidence일 때 해석문구 톤 다운(확정 표현 금지)

---

## 6) golden case 테스트 제안

목표: 규칙 회귀와 score 급변을 조기 검출.

## 최소 세트(12개 권장)
A. 데이터 완전 케이스(4)
1) high harmony (hap 중심)
2) high conflict (chung/hyeong 중심)
3) mixed neutral
4) element complement 강한 케이스

B. 신뢰도 케이스(4)
5) me time unknown
6) partner time unknown
7) both time unknown
8) partial pillars 강제(누락 입력)

C. 경계/회귀 케이스(4)
9) 자시 경계(23:30/00:30)
10) 절기 경계 인접일
11) timezone UTC vs Asia/Seoul 비교
12) provider v2->v1 degrade 시 score drift 제한

## 검증 항목
- `totalScore` 범위(0~100 또는 clamp 정책)
- `subScores` 합/정규화 일관성
- `basis.schemaVersion` 고정
- `provenance.ruleVersion` 기대값
- `warnings/confidence` 기대값
- 동일 입력 deterministic 보장

---

## 7) 구현 우선순위

### P0 (계약 고정)
- [ ] `ProviderCompatibilityResponseV2` 타입 정의
- [ ] basis/subScores/provenance 필드 스키마 문서화
- [ ] ruleVersion naming 정책 확정 (`compat-v2-basis`)

### P1 (Provider 계산 경로)
- [ ] compatibility 서비스에서 basis 생성 레이어 분리
- [ ] `totalScore/subScores/confidence/provenance` 반환
- [ ] v1 하위호환 필드 동시 제공(score/rawSignals)

### P2 (Front adapter 전환)
- [ ] front 매핑에서 `totalScore` 우선 사용
- [ ] `scoreRuleVersion` -> `provenance.ruleVersion` 우선 사용
- [ ] v2 부재 시 v1 파생 경로로 자동 강등

### P3 (테스트/관측)
- [ ] golden case fixture + contract test 추가
- [ ] warning code 집계 대시보드 항목 추가
- [ ] non-provider/mock-fallback 비율 임계치 재설정

### P4 (점진 롤아웃)
- [ ] canary(예: 10% 트래픽) → 50% → 100%
- [ ] drift 모니터링(totalScore v1/v2 차이)
- [ ] 안정화 후 deprecated 필드 제거 일정 공지

---

## 완료 기준(Definition of Done)
- provider가 v2 계약으로 `totalScore/subScores/basis/confidence/provenance`를 안정 반환
- front는 재계산 없이 provider authoritative score를 기본 사용
- fallback L0~L3가 테스트로 검증됨
- golden case 회귀 테스트가 CI에 포함됨
- 운영에서 warning/fallback 비율이 임계치 내 유지됨
