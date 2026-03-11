# Engine Refine Checklist (v1)

목표: mock 중심 MVP에서 real-provider 중심으로 안정 전환

## 0) Current fake/fallback map
- [x] Front daily fortune score: seed 기반 임시 점수 (`src/lib/dailyFortune.ts`)
- [x] Home/Persona narrative: seed + 문장 pool 선택 (`src/lib/engine/homeNarrative.ts`, `personaNarrative.ts`)
- [x] Engine default mode: `mock` (이번 변경으로 `real-provider` 기본화)
- [x] Provider `/saju/chart`: lunar-prep 경로 + 실패 시 fake fallback
- [x] Provider `/saju/compatibility-signals`: fake signals + 임시 score 파생

## 1) Phase A — real chart path 안정화 (진행 시작)
- [x] Front 엔진 기본 모드를 `real-provider`로 전환
- [ ] 운영 env에서 `VITE_SAJU_PROVIDER_BASE_URL` 명시
- [ ] `/saju/chart` 성공/실패 비율 로깅 기준 정의
- [ ] fallback 경고 코드 집계(예: PROVIDER_TIMEOUT, PROVIDER_UNAVAILABLE)
- [ ] chart 응답의 `ruleVersion`/`calculationSource`를 UI/로그에 노출

## 2) Phase B — compatibility 신호 체계 고정
- [ ] rawSignals를 단일 진실원천(SSoT)으로 사용
- [ ] score 파생 규칙 테이블 문서화 + 코드 단일화
- [ ] reliability 감점 규칙 확정(time unknown/partial data)
- [ ] fake score 직접 계산 경로 제거(호환 레이어만 유지)

## 3) Phase C — narrative를 provider 신호 기반으로 전환
- [ ] home narrative: seed pick -> signal-template renderer
- [ ] persona narrative: seed pick -> signal-template renderer
- [ ] mock narrative는 fallback 전용으로 축소

## 4) Phase D — 품질/배포 가드
- [ ] 절기 경계/자시/시간미상 회귀셋 자동화
- [ ] mock-fallback 비율 임계치 알림(예: >5%)
- [ ] 릴리즈 체크리스트에 engine 품질 항목 추가

## 작업 원칙
1. 사용자 체감 깨짐 방지: 실패 시 fallback 유지
2. 관측 가능성 우선: 경고/소스/룰버전 노출
3. 한 번에 교체하지 말고 단계별로 잠금
