# [Saju] earth dampening sweep v1 (N=40)

## 비교한 dampening 값
- 0.3 / 0.5 / 0.7

## 규칙별 strong 분포
- v1-current: {'wood': 8, 'fire': 6, 'earth': 12, 'metal': 4, 'water': 10}
- v2-month-branch-boost: {'wood': 6, 'fire': 7, 'earth': 13, 'metal': 6, 'water': 8}
- exp-v2-hidden-blend@base: {'wood': 5, 'fire': 6, 'earth': 17, 'metal': 6, 'water': 6}
- exp-v2-hidden-blend+damp@0.3: {'wood': 5, 'fire': 6, 'earth': 17, 'metal': 6, 'water': 6}
- exp-v2-hidden-blend+damp@0.5: {'wood': 6, 'fire': 6, 'earth': 16, 'metal': 6, 'water': 6}
- exp-v2-hidden-blend+damp@0.7: {'wood': 6, 'fire': 6, 'earth': 14, 'metal': 7, 'water': 7}

## overlap / non-overlap winner 변화 (기준: exp base)
- damp 0.3: overlap 0건, non-overlap 0건
- damp 0.5: overlap 1건, non-overlap 0건
- damp 0.7: overlap 3건, non-overlap 0건

## 추천
- overlap에만 작동하면서 non-overlap 영향이 적은 강도를 우선 채택