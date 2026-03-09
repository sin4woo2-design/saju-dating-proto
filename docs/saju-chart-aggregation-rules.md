# /saju/chart 오행 집계 규칙 (engine v0.3)

대상 코드:
- `backend/provider-python/app/services/chart_rules.py`
- 호출 경로: `chart_service -> lunar_chart -> score_elements`

## ruleVersion 구조
- `v1-current` : 기준 규칙
  - 천간 1.6 / 지지 1.0
- `v2-month-branch-boost` : **v2 candidate (기본 후보)**
  - 천간 1.6 / 지지 기본 1.0 + 월지 2.0
- `exp-v2-hidden-blend` : 실험 규칙
  - v2 + 지장간 약식 혼합 (`CHART_HIDDEN_STEM_BLEND` 0.4~0.6 권장)

## 현재 채택 상태
- 기본 런타임 기본값: `CHART_RULE_VERSION=v2-month-branch-boost`
- 단, 언제든 env로 `v1-current`로 롤백 가능

## 공통 집계 로직
1. 오행별 가중치 합산
2. 100 정규화
3. 반올림 오차는 최강 오행에 보정

## 신호 규칙
- `{STRONG}_STRONG`
- `{WEAK}_WEAK`
- `LUNAR_PILLARS_APPLIED`
- `RULE_{ruleVersion}`

## 보류 항목(아직 미반영)
- 월령(계절력) 보정
- 정식 지장간(비율/세부 파생) 고도화
- 일간 중심 강약 보정
- 윤달 입력 필드 확장
