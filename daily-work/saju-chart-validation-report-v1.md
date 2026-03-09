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
- 현재 런타임에서 Python 패키지 설치(`pip`, `pydantic`, `lunar_python`)가 불가하여,
  lunar-python 실계산 결과(pillars/fiveElements/signals)를 자동 채우지 못함.
- 따라서 매트릭스는 입력/검토 상태 중심으로 먼저 생성했고, 결과 컬럼은 `blocked`로 표시함.

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
- 현재 환경에서 lunar-python runtime 검증 불가

## 조정이 필요한 포인트
1. 월지/일간 가중치 재설계
2. 지장간 반영 규칙 추가
3. signals 확장(합/충/형/파/해)
4. 윤달(leap month) 입력 스키마 확장

## 다음 단계 제안
1. provider-python 실행 환경(venv + pip) 보장
2. 샘플 S01~S08에 대해 실제 결과 채움
3. 가중치 실험안 A/B (현재 vs 월지강화 vs 지장간포함)
4. 결과 리뷰 후 `/saju/chart` 집계 규칙 v2 확정
