# [Saju] lunar-python chart validation report v1

## 검증 목적
- `/saju/chart`의 lunar-python 경로 결과를 도메인 관점에서 검증 가능한 형태로 정리
- 오행 집계 규칙의 단순화/왜곡 포인트를 명시하고 조정 포인트를 합의

## 현재 /saju/chart 구조 요약
- `CHART_ENGINE_MODE=lunar-prep`일 때 `lunar_chart.calculate_chart_with_lunar` 우선 사용
- 실패 시 fake chart fallback + `PROVIDER_UNAVAILABLE`
- 출력: `pillars(year/month/day/hour)`, `fiveElements`, `signals`, `warnings`

## 검증용 샘플 입력 목록
- S01~S08 (daily-work/saju-chart-validation-v1.csv)
- 케이스 포함: birthTimeKnown=false, UTC timezone, 심야/자시 구간, gender=other

## 샘플별 결과 요약
- S01~S08 전 샘플에서 lunar-python 기반 pillars/fiveElements/signals 자동 산출 완료.
- `birthTimeKnown=false` 샘플(S02, S07)은 `PROVIDER_PARTIAL_DATA` warning이 정상 반영됨.
- 강세 오행 분포(8건): wood 2 / earth 4 / water 2 / fire 0 / metal 0
- 매트릭스 `review_status`는 전부 `measured`로 갱신됨.

## 오행 집계 규칙 설명
- 천간 4개: 가중치 1.6
- 지지 4개: 가중치 1.0
- 합산 후 100 정규화, 반올림 오차는 최강 오행에 보정
- signals: STRONG/WEAK + `LUNAR_PILLARS_APPLIED`

## 현재 한계와 리스크
- 지장간 미반영
- 월지/일간 비중 차등 미반영
- 계절력/왕상휴수사 미반영
- 음력 입력 윤달 정보 스키마 부재
- 현재 signals가 단순(강/약 중심)하여 해석 다양성이 낮음

## 조정이 필요한 포인트
1. 월지/일간 가중치 재설계
2. 지장간 반영 규칙 추가
3. signals 확장(합/충/형/파/해)
4. 윤달(leap month) 입력 스키마 확장

## 다음 단계 제안
1. 가중치 실험안 A/B (현재 vs 월지강화 vs 지장간포함)
2. 음력 입력 윤달(leap month) 필드 확장
3. signals 확장(합/충/형/파/해 + 일간 중심)
4. 결과 리뷰 후 `/saju/chart` 집계 규칙 v2 확정
