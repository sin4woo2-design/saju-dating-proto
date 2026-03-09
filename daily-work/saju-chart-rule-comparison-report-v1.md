# [Saju] chart aggregation rule comparison v1 (N=40)

## 비교 규칙
- v1-current
- v2-month-branch-boost (v2 candidate)
- exp-v2-hidden-blend@0.5 (experimental)

## strong 분포
- v1-current: {'wood': 8, 'fire': 6, 'earth': 12, 'metal': 4, 'water': 10}
- v2-month-branch-boost: {'wood': 6, 'fire': 7, 'earth': 13, 'metal': 6, 'water': 8}
- exp-v2-hidden-blend@0.5: {'wood': 5, 'fire': 6, 'earth': 17, 'metal': 6, 'water': 6}

## 해석
- v2는 월지 영향이 커지며 metal/fire가 일부 증가.
- exp 혼합안은 earth 집중이 커져 조기 채택은 보류.

## 추천
- 현재 후보: v2-month-branch-boost
- 보류: 지장간/월령 정밀 보정(실험단계 유지)
