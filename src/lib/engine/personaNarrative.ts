import type { ProviderState } from "./types";
import type { UserProfileInput } from "../../types/saju";

export type PersonaNarrativeConfidence = "high" | "medium" | "low";

export interface PersonaTraits {
  ageRange: string;
  personality: string;
  career: string;
  appearance: string;
}

export interface PersonaNarrativeSnapshot {
  providerState: ProviderState;
  personaTitle: string;
  personaSubtitle: string;
  personaTraits: PersonaTraits;
  dominantElement: string;
  supportElement: string;
  appealPoint: string;
  basisLabel: string;
  basisCodes: string[];
  confidence: PersonaNarrativeConfidence;
}

function seedFromProfile(input: UserProfileInput) {
  return `${input.birthDate}-${input.birthTime}-${input.gender}`
    .split("")
    .reduce((sum, ch) => sum + ch.charCodeAt(0), 0);
}

function pick<T>(seed: number, list: readonly T[]) {
  return list[seed % list.length];
}

const titles = ["온화한 기획형", "균형 조율형", "신뢰 공감형"] as const;

const subtitles = [
  "첫인상은 차분하고, 대화가 깊어질수록 매력이 선명해져요.",
  "관계 속도를 무리하게 올리지 않아 안정감이 오래갑니다.",
  "감정과 현실을 함께 보며 관계의 균형을 지키는 편이에요.",
] as const;

const ageRanges = ["27~33세", "29~35세", "30~36세"] as const;
const personalities = ["따뜻하지만 기준이 분명한 성향", "차분하고 배려 깊은 성향", "현실 감각이 좋은 조율형 성향"] as const;
const careers = ["기획·디자인·창작 분야", "서비스·운영·기획 분야", "연구·분석·전략 분야"] as const;
const appearances = ["차분하고 지적인 분위기", "부드럽고 단정한 분위기", "깔끔하고 신뢰감 있는 분위기"] as const;

const dominantElements = ["주기운 · 화(火)", "주기운 · 목(木)", "주기운 · 토(土)"] as const;
const supportElements = ["보완기운 · 수(水)", "보완기운 · 금(金)", "보완기운 · 수(水)"] as const;

const appealPoints = [
  "궁합 포인트 · 말의 온도를 맞추면 매력이 더 자연스럽게 보여요.",
  "궁합 포인트 · 약속 리듬이 맞으면 관계가 안정적으로 깊어져요.",
  "궁합 포인트 · 감정 표현 타이밍을 맞추면 신뢰가 빠르게 쌓여요.",
] as const;

function trimSentence(value: string, cap = 34) {
  if (value.length <= cap) return value;
  const sliced = value.slice(0, cap).trim();
  return sliced.endsWith(".") ? sliced : `${sliced}.`;
}

function buildBasisCodes(seed: number, providerState: ProviderState) {
  const toneCode = seed % 2 === 0 ? "PERSONA_TONE_WARM" : "PERSONA_TONE_CALM";
  const roleCode = seed % 3 === 0 ? "PERSONA_ROLE_STRATEGIST" : "PERSONA_ROLE_MEDIATOR";

  if (providerState === "provider") return ["PERSONA_PROFILE", "ELEMENT_BALANCE", toneCode, roleCode];
  if (providerState === "mock-fallback") return ["PROVIDER_PARTIAL_DATA", "MOCK_PERSONA_FALLBACK", toneCode, roleCode];
  return ["MOCK_PERSONA_V1", toneCode, roleCode];
}

function basisLabelByState(providerState: ProviderState) {
  if (providerState === "provider") return "해석 기준 · 실시간 사주 신호를 반영했어요.";
  if (providerState === "mock-fallback") return "해석 기준 · 일부 데이터는 기본 규칙으로 보완했어요.";
  return "해석 기준 · 기본 페르소나 규칙으로 생성했어요.";
}

export function buildMockPersonaNarrative(input: UserProfileInput, providerState: ProviderState): PersonaNarrativeSnapshot {
  const seed = seedFromProfile(input);
  const confidence: PersonaNarrativeConfidence = providerState === "provider" ? "high" : providerState === "mock-fallback" ? "medium" : "low";

  const personaTitle = pick(seed, titles);
  const rawSubtitle = pick(seed + 2, subtitles);
  const personaSubtitle = rawSubtitle.includes(personaTitle) ? subtitles[0] : rawSubtitle;

  return {
    providerState,
    personaTitle,
    personaSubtitle: trimSentence(personaSubtitle, 38),
    personaTraits: {
      ageRange: pick(seed + 3, ageRanges),
      personality: trimSentence(pick(seed + 5, personalities), 24),
      career: trimSentence(pick(seed + 7, careers), 24),
      appearance: trimSentence(pick(seed + 11, appearances), 22),
    },
    dominantElement: pick(seed + 13, dominantElements),
    supportElement: pick(seed + 17, supportElements),
    appealPoint: trimSentence(pick(seed + 19, appealPoints), 42),
    basisLabel: basisLabelByState(providerState),
    basisCodes: buildBasisCodes(seed, providerState),
    confidence,
  };
}
