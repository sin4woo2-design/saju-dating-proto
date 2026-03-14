# Real Engine 실행보드 (2026-03-14)

목표: 상용화 이전, 궁합 포함 실엔진 경로를 운영 기준으로 잠그기

## 현재 상태 (방금 검증)
- `./scripts/compat-release-gate.sh` ✅ 통과
  - provider tests: `9 passed, 12 subtests passed`
  - distribution report 생성 완료
  - frontend build/smoke 완료
- `npm run smoke:postdeploy` ✅ 통과
  - provider health: `http://localhost:8081` OK

## 트랙 A — 운영 설정 잠금 (E1)
- [ ] 운영 env에 아래 값 고정 확인
  - `CHART_ENGINE_MODE=lunar-prep`
  - `CHART_RULE_VERSION=v2-month-branch-boost`
- [ ] 운영 스모크 재실행
- [ ] 운영 로그에서 `calculationSource`, `ruleVersion` 분포 확인

완료 기준
- 운영 트래픽 샘플에서 chart의 provider source 비율 >= 95%
- warning(`PROVIDER_PARTIAL_DATA`) 비율 기준선 문서화

## 트랙 B — 궁합 authoritative score 고정 (E2)
- [x] provider v2 응답 구조 존재
  - `totalScore/subScores/basis/confidence/provenance`
- [ ] 프론트 어댑터가 `compatibility.totalScore`를 1순위 사용하도록 강제 점검
- [ ] fallback 시에만 legacy(v1) 파생 사용하도록 가드
- [ ] score drift 모니터링 항목 정의(v2 vs legacy)

완료 기준
- 프론트에서 provider authoritative score 경로가 기본
- legacy 점수 재계산 경로는 degrade 상황에서만 실행

## 트랙 C — 운영 관측/롤아웃 (E3)
- [ ] non-provider ratio, warning ratio 대시보드 점검 루틴 확정
- [ ] canary 10% → 50% → 100% 단계 기준 문서화
- [ ] 롤백 조건(에러율/경고율/score drift) 숫자 임계치 확정

완료 기준
- 단계별 롤아웃/롤백 규칙이 문서로 잠김
- 배포 시 체크리스트로 자동 참조 가능

## 오늘 즉시 액션
1. 프론트의 compatibility 점수 우선순위 코드 확인
2. 운영 env 값 확인 요청/적용
3. 운영 샘플 20회 기준 지표 스냅샷 채집
