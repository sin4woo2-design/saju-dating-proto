# Compatibility Real Raw Signals Spec (draft v1)

## 목적
- chart baseline은 `v2-month-branch-boost`로 고정하고,
- compatibility를 점수 중심 mock에서 **raw signals 중심**으로 전환하기 위한 계약을 정의한다.

## 현재 구조(요약)
- provider는 `compatibility.signals: string[]` + 임시 `score` 반환
- 앱은 score를 우선 사용하고, 없으면 fallback 점수 사용

## 목표 구조
- provider가 아래 raw signals를 구조화해서 반환
- 앱은 raw signals -> 점수 파생 -> 문구 생성 순서로 연결
- score는 선택적(선계산) 필드로 유지

## raw signal category
1. relation-branch (지지 관계)
   - HAP, CHUNG, HYEONG, PA, HAE
2. relation-stem (천간 관계)
   - HAP_STEM, CHUNG_STEM, CLASH_STEM
3. element-dynamics (오행 상성)
   - GENERATES, CONTROLS, OVERWEIGHT, LACKING
4. day-master-dynamics (일간 중심)
   - DAYMASTER_SUPPORT, DAYMASTER_CLASH
5. reliability
   - TIME_UNKNOWN_ME, TIME_UNKNOWN_PARTNER, PARTIAL_PILLARS

## signal code 초안
- BRANCH_HAP_YEAR
- BRANCH_CHUNG_DAY
- BRANCH_HYEONG_MONTH
- BRANCH_PA_DAY
- BRANCH_HAE_HOUR
- STEM_HAP_DAY
- STEM_CHUNG_DAY
- ELEMENT_GENERATES_MUTUAL
- ELEMENT_CONTROLS_IMBALANCED
- DAYMASTER_SUPPORT_MUTUAL
- DAYMASTER_CLASH
- RELIABILITY_TIME_UNKNOWN_ME
- RELIABILITY_TIME_UNKNOWN_PARTNER
- RELIABILITY_PARTIAL_PILLARS

## score 파생 연결 초안
- base = 70
- relation-branch
  - HAP +7 / CHUNG -6 / HYEONG -4 / PA -3 / HAE -2
- relation-stem
  - HAP_STEM +4 / CHUNG_STEM -4
- element-dynamics
  - GENERATES +3 / CONTROLS -3 / OVERWEIGHT -2 / LACKING -2
- day-master-dynamics
  - SUPPORT +3 / CLASH -4
- reliability
  - TIME_UNKNOWN_* 각각 -3
  - PARTIAL_PILLARS -4
- clamp: 40~96

## 상태 규칙
- reliability signal 포함 시 warnings에 `PROVIDER_PARTIAL_DATA` 권장
- score는 optional, raw signals만으로도 계산 가능해야 함

## 이번 턴 범위
- 설계/스펙만 반영
- 실제 compatibility real 계산은 다음 단계
