# 사주 엔진 도입 준비 리포트 (초안)

## 1) 현재 mock 사주/궁합 계산 로직 분석

### 사주 (`src/lib/engine/mockEngine.ts`)
- 입력값(name/birthDate/birthTime/gender)을 문자열로 합쳐 charCode 합산 seed 생성
- seed를 기반으로 오행 수치(wood/fire/earth/metal/water) 산출
- 오행 상/하위 요소를 기준으로 성향/연애스타일/이상형 텍스트를 규칙 생성
- 특징: **결과가 결정적(deterministic)**, 호출 빠름, 외부 의존성 없음
- 한계: 절기/간지/시주/대운 등 실제 명리 계산 근거 없음

### 궁합 (`src/lib/engine/mockEngine.ts`)
- 양측 입력값 seed 차이(gap) + gender 기반 boost로 점수 계산
- 점수 범위를 58~96으로 clamp
- 텍스트 해석은 점수 구간별 규칙
- 특징: UI 실험용으로 충분히 안정적
- 한계: 실제 명리 궁합 규칙(합/충/형/파/해, 용신/희신 등) 미반영

---

## 2) 엔진 교체 가능한 추상화 레이어 설계

추가된 레이어:
- `src/lib/engine/types.ts`
  - `SajuEngine` 인터페이스 정의
  - `EngineMode = "mock" | "real-stub"`
  - `SajuResult`, `CompatibilityResult` 표준 출력
- `src/lib/engine/index.ts`
  - 엔진 선택 라우터 (`getEngine`)
  - `VITE_SAJU_ENGINE_MODE` 환경변수 기반 선택
- `src/lib/engine/mockEngine.ts`
  - 기존 mock 구현을 provider 형태로 이관
- `src/lib/engine/realEngineStub.ts`
  - 실엔진 미연동 상태를 명시하는 스텁 + mock 폴백

호환성 유지:
- 기존 사용처(`src/pages/*`)는 수정 최소화
- `src/lib/sajuEngine.ts`, `src/lib/compatibility.ts`는 레거시 API를 유지하면서 내부에서 엔진 라우터 사용

---

## 3) real engine stub 구조

`realEngineStub` 동작 원칙:
- 실엔진 미연결 시에도 앱 흐름은 유지
- 출력에 `warnings: ["REAL_ENGINE_NOT_CONNECTED", ...]` 포함
- 결과 값은 mock 폴백으로 공급

목표:
- UI/호출부/데이터 스키마를 먼저 안정화
- 실엔진 연결 시 provider만 교체

---

## 4) JS/TS 기준 후보 방식 조사 (2~3개)

## A안) JS/TS 순수 라이브러리 조합형
- 구성 예: 음력/절기 계산 라이브러리 + 간지/오행 룰 엔진 자체 구현
- 장점: 앱 내 일체형, 인프라 단순, 오프라인 가능
- 단점: 명리 규칙 정확도 검증 비용 큼, 구현 난이도 높음
- 추천 상황: 장기적으로 엔진 내재화 의지가 강할 때

## B안) Python/기존 검증 엔진을 API화 후 TS에서 호출
- 구성 예: FastAPI(명리 계산) + 프론트는 HTTP 호출
- 장점: 검증된 계산 로직 재사용 가능, 정밀도 확보 용이
- 단점: 서버 운영 복잡도/비용 증가, 네트워크 의존
- 추천 상황: 정확도 우선 + 백엔드 운영 가능할 때

## C안) 하이브리드(핵심 계산 API + 해석/문구 TS)
- 구성: 팔자/오행/궁합 핵심지표는 API, 결과 문구/UX 로직은 TS
- 장점: 정확도와 제품 속도의 균형, 문구 실험 빠름
- 단점: 경계 설계(어디까지 API 책임인지) 필요
- 추천 상황: MVP 빠른 전환 + 점진 정밀화 전략

### 1차 추천
- **C안 > B안 > A안**
- 이유: 현재 앱 상태(프론트 MVP)에서 리스크/속도 밸런스가 가장 좋음

---

## 5) 검증용 테스트 케이스 초안

## 인터페이스/회귀 테스트
1. `calculateSaju(input)`는 항상 `fiveElements` 5개 키를 반환
2. 동일 입력 2회 호출 시 동일 결과(결정성)
3. 빈 입력/비정상 입력 형식 처리 정책(throw 또는 fallback) 명확화
4. `calculateCompatibility` 점수는 0~100(또는 정의 범위) 보장

## 실엔진 전환 대비 계약(Contract) 테스트
1. mock vs real-stub 모두 `SajuEngine` 인터페이스 만족
2. `source` 필드가 모드에 맞게 반환
3. real-stub는 경고 코드(`REAL_ENGINE_NOT_CONNECTED`) 포함
4. 기존 페이지(MySaju/Compatibility)가 provider 변경 후도 렌더 실패 없음

## 도메인 타당성 테스트(후속)
1. 절기 경계값(입춘 전/후) 케이스
2. 자시(23:00~00:59) 처리 룰 케이스
3. 시간 미상(12:00 기본값) 결과 안정성
4. 동일 생년월일, 시간만 변경 시 시주 반영 차이

---

## 6) 적용 가이드

- 기본 모드: `mock`
- 스텁 강제 확인이 필요하면 `.env`에
  - `VITE_SAJU_ENGINE_MODE=real-stub`
- 이후 실엔진 붙일 때는 `realEngineStub.ts`를 provider 기반 엔진으로 교체
- 상세 provider 계약/실패정책은 `docs/saju-real-provider-spec.md` 기준으로 진행
