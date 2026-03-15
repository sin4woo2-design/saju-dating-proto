# 사주 페르소나 12타입 분류표 v1

목적: 기존 `buildPersonaBasis(...)` 결과를 사용자 친화적인 12타입 체계로 번역하기 위한 classifier 레이어.

## 입력 basis
- dominantElement
- supportElement
- personaTone
- appealAxis
- relationStyle
- confidence (타입 결정 보조/설명 톤 보정)

## 12타입 목록

1. **PT01 따뜻한 전략가형**
   - 부제: 배려와 기준을 함께 세우는 타입
   - 핵심: 관계 온도와 구조를 동시에 관리

2. **PT02 차분한 조율가형**
   - 부제: 감정과 현실의 균형을 맞추는 타입
   - 핵심: 갈등을 낮추고 흐름을 안정화

3. **PT03 직관 추진형**
   - 부제: 핵심을 빠르게 포착해 실행하는 타입
   - 핵심: 판단 속도와 실행 연결

4. **PT04 안정 보호형**
   - 부제: 루틴과 신뢰를 단단히 지키는 타입
   - 핵심: 지속성/일관성 기반 관계 유지

5. **PT05 감정 공명형**
   - 부제: 상대 감정의 결을 섬세하게 읽는 타입
   - 핵심: 정서 호흡 동기화

6. **PT06 현실 설계형**
   - 부제: 구체적 계획으로 관계를 안정시키는 타입
   - 핵심: 실행 가능한 구조 설계

7. **PT07 영감 표현형**
   - 부제: 표현력으로 분위기를 이끄는 타입
   - 핵심: 전달력/활력 중심 상호작용

8. **PT08 신중 관찰형**
   - 부제: 맥락을 충분히 읽고 움직이는 타입
   - 핵심: 저속 심화, 안정적 판단

9. **PT09 유연 중재형**
   - 부제: 서로 다른 리듬을 연결하는 타입
   - 핵심: 완충/합의 촉진

10. **PT10 단단한 기준형**
    - 부제: 원칙과 경계를 명확히 세우는 타입
    - 핵심: 기준 명료화로 혼선 축소

11. **PT11 부드러운 연결형**
    - 부제: 관계를 자연스럽게 이어주는 타입
    - 핵심: 연결감/배려 중심

12. **PT12 몰입 개척형**
    - 부제: 의미를 찾으면 깊게 파고드는 타입
    - 핵심: 집중과 개척 추진

---

## 주요 매핑 규칙 (요약)

- fire + strategist → PT07
- earth + strategist → PT06
- metal + strategist → PT10
- water + emotion-sync → PT05
- wood + rhythm-sync → PT12
- strategist + warm → PT01
- strategist + calm → PT08
- mediator + trust-build → PT02
- mediator + emotion-sync → PT11
- mediator + rhythm-sync → PT09
- supportElement=water → PT04
- fallback → PT03

confidence는 타입 코드 결정을 크게 뒤집지 않고, summary 톤만 보정한다.

---

## 예시

- basis: `{ dominantElement: "metal", relationStyle: "strategist", personaTone: "calm", appealAxis: "trust-build" }`
  - 분류: **PT10 단단한 기준형**

- basis: `{ dominantElement: "water", relationStyle: "mediator", appealAxis: "emotion-sync" }`
  - 분류: **PT05 감정 공명형** (water+emotion-sync 우선)

- basis: `{ dominantElement: "wood", relationStyle: "mediator", appealAxis: "rhythm-sync" }`
  - 분류: **PT12 몰입 개척형** (wood+rhythm-sync 우선)

---

## 구현 위치
- classifier: `src/lib/engine/personaClassifier.ts`
- 연결 포인트: `src/lib/engine/personaNarrative.ts` (`personaType` 필드)
