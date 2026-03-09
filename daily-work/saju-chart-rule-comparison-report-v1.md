# [Saju] chart aggregation rule comparison v1 (N=40)

## 비교한 규칙안
1. 현행 규칙(천간 1.6 / 지지 1.0)
2. 월지 강화 규칙(월지 지지 가중치 2.0)
3. 지장간 포함 규칙(지장간 0.8 가산)

## strong element 분포
- 현행: wood 8 / fire 6 / earth 12 / metal 4 / water 10
- 월지 강화: wood 6 / fire 7 / earth 13 / metal 6 / water 8
- 지장간 포함: wood 5 / fire 7 / earth 14 / metal 8 / water 6

## warning/partial 요약
- partial count: 10 / 40 (25.0%)
- warning 분포: {'NONE': 30, 'PROVIDER_PARTIAL_DATA': 10}

## 편향 점검
- earth strong은 현행 12/40(30.0%)에서 월지 강화 13/40, 지장간 포함 14/40로 유지/소폭 증가.
- fire strong은 현행 6건 → 월지 강화 7건, 지장간 포함 7건으로 증가.
- 현행 대비 월지 강화가 분포 균형을 일부 개선(wood/water 감소, fire/metal 증가).

## 추천 규칙안
- **월지 강화 규칙**을 1차 추천.
- 보류 사유: 지장간 포함 규칙은 분포 변화가 커서 도메인 합의(지장간 가중치/분해비) 전 조기 채택 리스크가 있음.

## 다음 단계
1. 샘플 80+로 확대 후 재측정
2. 월지 강화 + 지장간 약식(0.4) 혼합안 추가
3. partial 케이스(birthTimeKnown=false) 별도 분석 리포트 분리
