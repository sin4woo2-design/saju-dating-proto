import type { PersonaNarrativeBasis, PersonaNarrativeConfidence } from "./personaNarrative";

export interface PersonaTypeModel {
  code: string;
  title: string;
  subtitle: string;
  summary: string;
  dominantStyle: string;
  relationshipStyle: string;
}

export interface PersonaTypeResult extends PersonaTypeModel {
  ruleKey: string;
}

export const PERSONA_12TYPE_V1: readonly PersonaTypeModel[] = [
  {
    code: "PT01",
    title: "따뜻한 전략가형",
    subtitle: "배려와 기준을 함께 세우는 타입",
    summary: "관계의 온도를 지키면서도 방향을 잃지 않는 편입니다.",
    dominantStyle: "정리된 추진",
    relationshipStyle: "안정 리드",
  },
  {
    code: "PT02",
    title: "차분한 조율가형",
    subtitle: "감정과 현실의 균형을 맞추는 타입",
    summary: "갈등을 키우지 않고 흐름을 안정적으로 조정합니다.",
    dominantStyle: "균형 조정",
    relationshipStyle: "완충형 소통",
  },
  {
    code: "PT03",
    title: "직관 추진형",
    subtitle: "핵심을 빠르게 포착해 실행하는 타입",
    summary: "감각적으로 방향을 잡고 결정을 빠르게 연결합니다.",
    dominantStyle: "직관 실행",
    relationshipStyle: "속도형 상호작용",
  },
  {
    code: "PT04",
    title: "안정 보호형",
    subtitle: "루틴과 신뢰를 단단히 지키는 타입",
    summary: "관계를 오래 유지하는 힘이 강하고 일관성이 높습니다.",
    dominantStyle: "지속 운영",
    relationshipStyle: "신뢰 축적",
  },
  {
    code: "PT05",
    title: "감정 공명형",
    subtitle: "상대 감정의 결을 섬세하게 읽는 타입",
    summary: "정서적 호흡을 맞추는 능력이 관계의 강점으로 작동합니다.",
    dominantStyle: "정서 공명",
    relationshipStyle: "공감 중심",
  },
  {
    code: "PT06",
    title: "현실 설계형",
    subtitle: "구체적 계획으로 관계를 안정시키는 타입",
    summary: "막연한 감정보다 실행 가능한 구조를 먼저 세우는 편입니다.",
    dominantStyle: "구조 설계",
    relationshipStyle: "계획형 협력",
  },
  {
    code: "PT07",
    title: "영감 표현형",
    subtitle: "표현력으로 분위기를 이끄는 타입",
    summary: "아이디어와 감정 표현이 자연스럽고 전달력이 높습니다.",
    dominantStyle: "표현 확장",
    relationshipStyle: "활력형 소통",
  },
  {
    code: "PT08",
    title: "신중 관찰형",
    subtitle: "맥락을 충분히 읽고 움직이는 타입",
    summary: "성급하지 않게 상황을 살피며 안정적인 선택을 선호합니다.",
    dominantStyle: "분석 관찰",
    relationshipStyle: "저속 심화",
  },
  {
    code: "PT09",
    title: "유연 중재형",
    subtitle: "서로 다른 리듬을 연결하는 타입",
    summary: "긴장을 낮추고 합의점을 찾는 조정력이 뛰어납니다.",
    dominantStyle: "완충 중재",
    relationshipStyle: "합의 촉진",
  },
  {
    code: "PT10",
    title: "단단한 기준형",
    subtitle: "원칙과 경계를 명확히 세우는 타입",
    summary: "기준이 분명해 관계의 혼선을 줄이는 데 강점이 있습니다.",
    dominantStyle: "원칙 정렬",
    relationshipStyle: "명료한 경계",
  },
  {
    code: "PT11",
    title: "부드러운 연결형",
    subtitle: "관계를 자연스럽게 이어주는 타입",
    summary: "강한 주장보다 연결감을 우선해 관계 만족도를 높입니다.",
    dominantStyle: "연결 중심",
    relationshipStyle: "유연한 배려",
  },
  {
    code: "PT12",
    title: "몰입 개척형",
    subtitle: "의미를 찾으면 깊게 파고드는 타입",
    summary: "관심이 생긴 영역에서 집중력과 추진력이 크게 올라갑니다.",
    dominantStyle: "집중 개척",
    relationshipStyle: "심화형 결속",
  },
] as const;

const TYPE_BY_CODE = Object.fromEntries(PERSONA_12TYPE_V1.map((t) => [t.code, t])) as Record<string, PersonaTypeModel>;

function pickCodeByBasis(basis: PersonaNarrativeBasis): string {
  const { dominantElement, relationStyle, personaTone, appealAxis, supportElement } = basis;

  if (dominantElement === "fire" && relationStyle === "strategist") return "PT07";
  if (dominantElement === "earth" && relationStyle === "strategist") return "PT06";
  if (dominantElement === "metal" && relationStyle === "strategist") return "PT10";
  if (dominantElement === "water" && appealAxis === "emotion-sync") return "PT05";
  if (dominantElement === "wood" && appealAxis === "rhythm-sync") return "PT12";

  if (relationStyle === "strategist" && personaTone === "warm") return "PT01";
  if (relationStyle === "strategist" && personaTone === "calm") return "PT08";

  if (relationStyle === "mediator" && appealAxis === "trust-build") return "PT02";
  if (relationStyle === "mediator" && appealAxis === "emotion-sync") return "PT11";
  if (relationStyle === "mediator" && appealAxis === "rhythm-sync") return "PT09";

  if (supportElement === "water") return "PT04";
  return "PT03";
}

function toneAdjust(model: PersonaTypeModel, confidence: PersonaNarrativeConfidence): string {
  if (confidence === "high") return `${model.summary} 현재 입력 기준에서는 해석 안정성이 높은 편입니다.`;
  if (confidence === "medium") return `${model.summary} 핵심 흐름은 유효하지만 일부 값은 보정되어 해석됩니다.`;
  return `${model.summary} 입력 제약이 있어 큰 흐름 중심으로 참고하는 것이 좋습니다.`;
}

export function classifyPersonaType(basis: PersonaNarrativeBasis, confidence: PersonaNarrativeConfidence): PersonaTypeResult {
  const code = pickCodeByBasis(basis);
  const model = TYPE_BY_CODE[code] ?? TYPE_BY_CODE.PT03;

  return {
    ...model,
    summary: toneAdjust(model, confidence),
    ruleKey: `persona-12type-v1:${code}`,
  };
}
