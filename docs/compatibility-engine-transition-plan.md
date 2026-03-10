# Compatibility Engine Transition Plan (draft)

## 현재 구조 분석
- Provider(fake): `signals(string[])` + 임시 `score`
- Backend: `derive_score_from_signals()`로 점수 파생
- Front: provider score 우선 사용, 없으면 fallback(72)
- 문제: 신호 의미/가중치/신뢰도 추적이 약함

## 목표 구조
1. Provider는 raw signals를 구조화 반환
2. Backend/Front는 동일 룰 테이블로 score 파생
3. reliability(시간 미상, 부분 데이터) 신호를 명시 반영

## 현재 반영
- `/saju/compatibility-signals` 응답에 `rawSignals`, `reliability` 필드 반영
- `derive_score_from_signals` -> rawSignals weight 합산 방식으로 전환
- score/signal 하위호환 유지

## 연결 전략
- 1단계(이번): 계약/타입/문서 정리
- 2단계: fake provider에서 `rawSignals` 필드 추가(기존 signals 유지)
- 3단계: `derive_score_from_signals`를 rawSignals 기반으로 전환
- 4단계: score + rawSignals 동시 검증 후 score 필드 optional화

## 점수 파생 구조(초안)
- base 70
- branch 합/충/형/파/해 +7/-6/-4/-3/-2
- stem 합/충 +4/-4
- element 상성 +3/-3, 편중 -2
- daymaster support/clash +3/-4
- reliability(time unknown) -3, partial pillars -4
- clamp 40~96

## 보류 항목
- 실제 명리 궁합 룰 정밀화(용신/희신, 대운 연동)
- chart와의 결합 강도(가중치 상호의존)
