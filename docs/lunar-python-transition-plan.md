# lunar-python 전환 최소 구현 계획 (provider-python)

## 1) 현재 fake 계산 로직 분석
- `/saju/chart`: 입력 해시 기반으로 오행/간지/signals를 생성(결정적, 비명리)
- `/saju/compatibility-signals`: 해시 기반 signals 생성 + 임시 규칙으로 score 파생
- 정책 검증(timezone/calendarType/birthTimeKnown)은 이미 라우트 앞단에서 동작

## 2) 최소 전환 전략 (단계적)
### Phase A (이번 단계 완료)
- chart 엔진 선택 레이어 추가: `chart_service.get_chart()`
- lunar 준비용 엔진 자리 추가: `lunar_chart.calculate_chart_with_lunar()` (미구현)
- `CHART_ENGINE_MODE=lunar-prep`일 때 lunar 시도 후 실패 시 fake fallback

### Phase B (진행 중)
- `lunar_chart.py`에 실제 lunar-python 계산 로직 최소 연결 완료
- 입력 변환: timezone/calendarType/birthTimeKnown 반영(최소)
- 출력 매핑: pillars(연/월/일/시), 오행 정규화(합계 100), 기본 signals 도출
- 남은 과제: lunar 입력(윤달 등) 정밀 처리, 신호 체계 고도화

### Phase C (호환/궁합)
- `/saju/compatibility-signals`는 score 직접 계산 대신
  provider raw signals를 우선 출력하고, 점수는 signals 기반 파생 규칙 유지/고도화
- 이후 프론트 또는 provider에서 score 규칙을 합의해 단일화

## 3) lunar-python 도입 포인트
- 예상 의존성: `lunar-python` (+ 표준 datetime/zoneinfo)
- 핵심 포인트:
  1. birthDate + birthTime + timezone -> datetime 변환
  2. solar/lunar 입력 분기(초기엔 solar 우선)
  3. 팔자(연월일시) 추출
  4. 천간/지지 -> 오행 집계
  5. signals(편중/보완/충돌) 규칙화

## 4) chart/compatibility 전환 전략
- chart: 먼저 실제화(리스크 낮고 프론트 체감 즉시 가능)
- compatibility: raw signal 중심으로 먼저 안정화 후 score 규칙 단계 도입

## 5) 코드 반영 가능 범위(이번 턴)
- fake 유지 + 전환 지점/서비스 레이어 준비까지
- 실제 lunar-python 설치/실계산 구현은 다음 턴
