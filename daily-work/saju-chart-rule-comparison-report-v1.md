# [Saju] chart aggregation rule comparison v1 (N=40)

## 비교 blend 값
- exp-v2-hidden-blend @ 0.4 / 0.5 / 0.6

## 규칙별 strong element 분포
| rule | wood | fire | earth | metal | water |
|---|---:|---:|---:|---:|---:|
| v1-current | 8 | 6 | 12 | 4 | 10 |
| v2-month-branch-boost | 6 | 7 | 13 | 6 | 8 |
| exp-v2-hidden-blend@0.4 | 5 | 6 | 17 | 6 | 6 |
| exp-v2-hidden-blend@0.5 | 5 | 6 | 17 | 6 | 6 |
| exp-v2-hidden-blend@0.6 | 5 | 6 | 17 | 6 | 6 |

## 변화량 요약 (기준: v1-current)
- v2-month-branch-boost: earth +1, fire +1, metal +2
- exp-v2-hidden-blend@0.4: earth +5, fire +0, metal +2
- exp-v2-hidden-blend@0.5: earth +5, fire +0, metal +2
- exp-v2-hidden-blend@0.6: earth +5, fire +0, metal +2

## earth 편향 완화 여부
- v1-current earth: 12/40 (30.0%)
- v2-month-branch-boost earth: 13/40 (32.5%)
- hidden-blend(0.4~0.6) earth: 17/40 (42.5%)로 증가하여 완화 실패

## 추천
- 추천 설정: **v2-month-branch-boost 유지**
- 보류 사유: hidden-blend는 0.4~0.6 전 구간에서 earth 편향이 악화되고 fire/metal 개선도 제한적