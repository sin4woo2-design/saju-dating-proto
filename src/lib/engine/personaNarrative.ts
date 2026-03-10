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

const titles = ["따뜻한 전략가형", "균형 잡힌 조율가형", "신중한 공감가형"] as const;

const subtitles = [
  "공감과 판단이 함께 작동하는 관계형 페르소나예요.",
  "감정과 현실의 균형을 잘 맞추는 타입이에요.",
  "차분한 소통으로 신뢰를 쌓는 흐름이 강해요.",
] as const;

const ageRanges = ["27~33세", "29~35세", "30~36세"] as const;
const personalities = ["따뜻하고 전략적인 성향", "차분하고 안정적인 성향", "현실 감각이 좋은 조율형 성향"] as const;
const careers = ["기획·디자인·창작형", "서비스·운영·기획형", "연구·분석·전략형"] as const;
const appearances = ["차분하고 지적인 인상", "부드럽고 단정한 인상", "깔끔하고 신뢰감 있는 인상"] as const;

const dominantElements = ["강한 기운 · 화(火)", "강한 기운 · 목(木)", "강한 기운 · 토(土)"] as const;
const supportElements = ["보완 기운 · 수(水)", "보완 기운 · 금(金)", "보완 기운 · 수(水)"] as const;

const appealPoints = [
  "궁합 포인트 · 대화의 톤을 맞추면 매력이 잘 드러나요.",
  "궁합 포인트 · 약속 리듬이 맞으면 안정감이 커져요.",
  "궁합 포인트 · 감정 표현의 타이밍이 핵심이에요.",
] as const;

function buildBasisCodes(seed: number, providerState: ProviderState) {
  const toneCode = seed % 2 === 0 ? "PERSONA_TONE_WARM" : "PERSONA_TONE_CALM";
  const roleCode = seed % 3 === 0 ? "PERSONA_ROLE_STRATEGIST" : "PERSONA_ROLE_MEDIATOR";

  if (providerState === "provider") return ["PERSONA_PROFILE", "ELEMENT_BALANCE", toneCode, roleCode];
  if (providerState === "mock-fallback") return ["PROVIDER_PARTIAL_DATA", "MOCK_PERSONA_FALLBACK", toneCode, roleCode];
  return ["MOCK_PERSONA_V1", toneCode, roleCode];
}

export function buildMockPersonaNarrative(input: UserProfileInput, providerState: ProviderState): PersonaNarrativeSnapshot {
  const seed = seedFromProfile(input);
  const confidence: PersonaNarrativeConfidence = providerState === "provider" ? "high" : providerState === "mock-fallback" ? "medium" : "low";

  return {
    providerState,
    personaTitle: pick(seed, titles),
    personaSubtitle: pick(seed + 2, subtitles),
    personaTraits: {
      ageRange: pick(seed + 3, ageRanges),
      personality: pick(seed + 5, personalities),
      career: pick(seed + 7, careers),
      appearance: pick(seed + 11, appearances),
    },
    dominantElement: pick(seed + 13, dominantElements),
    supportElement: pick(seed + 17, supportElements),
    appealPoint: pick(seed + 19, appealPoints),
    basisLabel: providerState === "provider" ? "실시간 페르소나 해석" : providerState === "mock-fallback" ? "부분 fallback 페르소나" : "기본 mock 페르소나",
    basisCodes: buildBasisCodes(seed, providerState),
    confidence,
  };
}
