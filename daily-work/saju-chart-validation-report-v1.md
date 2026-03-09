# [Saju] lunar-python chart validation report v1

## 검증 목적
- `/saju/chart` lunar-python 결과를 규칙 검증 가능한 데이터셋으로 운영

## 샘플 구성
- 총 샘플: 40개
- partial(birthTimeKnown=false): 10개
- 분산: UTC/Asia-Seoul, 경계 시각, 연령대/성별/계절 분산 포함

## measured 요약
- strong 분포: {'wood': 8, 'fire': 6, 'earth': 12, 'metal': 4, 'water': 10}
- 원본 데이터: `daily-work/saju-chart-validation-v1.csv`, `daily-work/saju-chart-validation-v1.json`

## 규칙 비교
- 비교 결과 문서: `daily-work/saju-chart-rule-comparison-report-v1.md`

## 리스크
- 윤달 입력 미반영
- signals 단순(강/약 중심)
- 지장간/월령 정밀 보정 미반영
