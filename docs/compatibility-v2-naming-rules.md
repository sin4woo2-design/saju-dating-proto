# Compatibility v2 Naming Rules (P0)

본 문서는 compatibility real-engine 전환의 P0 단계에서 고정한 명명 규칙이다.

## 1) ruleVersion
- 형식: `compat-v<major>-<descriptor>`
- 예시: `compat-v2-basis`
- 반환 위치: `compatibility.provenance.ruleVersion`

## 2) basisSchemaVersion
- 형식: `compat-basis-v<major>`
- 현재 고정값: `compat-basis-v1`
- 반환 위치: `compatibility.basis.schemaVersion`, `compatibility.provenance.basisSchemaVersion`

## 3) confidence enum
- `high | medium | low`
- basis 내부: `compatibility.basis.reliability.confidence`
- 응답 상위: `compatibility.confidence.level`

## 4) warning code enum
- 공통
  - `PROVIDER_TIMEOUT`
  - `PROVIDER_UNAVAILABLE`
  - `PROVIDER_BAD_RESPONSE`
  - `PROVIDER_PARTIAL_DATA`
- compatibility 확장
  - `COMPAT_RULE_DEGRADED`
  - `COMPAT_BASIS_INCOMPLETE`

## 5) subScores 키 구조
고정 키:
- `branch`
- `stem`
- `elements`
- `dayMaster`
- `reliability`

## 6) basis 내부 필드 구조
- `participants.me|partner`
- `relations.branchRelations|stemRelations|elementDynamics|dayMasterDynamics`
- `reliability.penalties|confidence`

위 규칙은 P1 구현(실제 provider 반환값 채우기)에서 반드시 준수한다.
