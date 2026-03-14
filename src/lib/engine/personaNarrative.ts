import type { ProviderState, SajuResult } from "./types";
import type { UserProfileInput } from "../../types/saju";
import type { NarrativeProvenance } from "./homeNarrative";

export type PersonaNarrativeConfidence = "high" | "medium" | "low";

export interface PersonaTraits {
  ageRange: string;
  personality: string;
  career: string;
  appearance: string;
}

export interface PersonaNarrativeBasis {
  dominantElement: "wood" | "fire" | "earth" | "metal" | "water";
  supportElement: "wood" | "fire" | "earth" | "metal" | "water";
  personaTone: "warm" | "calm";
  appealAxis: "emotion-sync" | "rhythm-sync" | "trust-build";
  relationStyle: "strategist" | "mediator";
  basisCodes: string[];
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
  ruleVersion: string;
  provenance: NarrativeProvenance;
  basis: PersonaNarrativeBasis;
}

const PERSONA_RULE_VERSION = "persona-v2";

interface PersonaBasisContext {
  saju?: SajuResult;
}

function seedFromProfile(input: UserProfileInput) {
  return `${input.birthDate}-${input.birthTime}-${input.gender}`
    .split("")
    .reduce((sum, ch) => sum + ch.charCodeAt(0), 0);
}

function pick<T>(seed: number, list: readonly T[]) {
  return list[seed % list.length];
}

function trimSentence(value: string, cap = 34) {
  if (!value) return "페르소나 근거를 준비 중이에요.";
  if (value.length <= cap) return value;
  const sliced = value.slice(0, cap).trim();
  return sliced.endsWith(".") ? sliced : `${sliced}.`;
}

function elementBySeed(seed: number): PersonaNarrativeBasis["dominantElement"] {
  const elements: PersonaNarrativeBasis["dominantElement"][] = ["wood", "fire", "earth", "metal", "water"];
  return pick(seed, elements);
}

function confidenceByState(providerState: ProviderState): PersonaNarrativeConfidence {
  if (providerState === "provider") return "high";
  if (providerState === "mock-fallback") return "medium";
  return "low";
}

function chartSourceByState(providerState: ProviderState) {
  if (providerState === "provider") return "provider";
  if (providerState === "mock-fallback") return "mock-fallback";
  return "mock";
}

function basisLabelByState(providerState: ProviderState) {
  if (providerState === "provider") return "해석 기준 · 실시간 사주 신호를 반영했어요.";
  if (providerState === "mock-fallback") return "해석 기준 · 일부 데이터는 기본 규칙으로 보완했어요.";
  return "해석 기준 · 기본 페르소나 규칙으로 생성했어요.";
}

function buildBasisCodes(providerState: ProviderState, tone: PersonaNarrativeBasis["personaTone"], relationStyle: PersonaNarrativeBasis["relationStyle"]) {
  const toneCode = tone === "warm" ? "PERSONA_TONE_WARM" : "PERSONA_TONE_CALM";
  const roleCode = relationStyle === "strategist" ? "PERSONA_ROLE_STRATEGIST" : "PERSONA_ROLE_MEDIATOR";

  if (providerState === "provider") return ["PERSONA_PROFILE", "ELEMENT_BALANCE", toneCode, roleCode];
  if (providerState === "mock-fallback") return ["PROVIDER_PARTIAL_DATA", "MOCK_PERSONA_FALLBACK", toneCode, roleCode];
  return ["MOCK_PERSONA_V1", toneCode, roleCode];
}

function sortedElementsByScore(saju?: SajuResult) {
  const fe = saju?.profile?.fiveElements;
  if (!fe) return [] as Array<{ key: PersonaNarrativeBasis["dominantElement"]; value: number }>;

  return (Object.entries(fe) as Array<[PersonaNarrativeBasis["dominantElement"], number]>)
    .sort((a, b) => b[1] - a[1])
    .map(([key, value]) => ({ key, value }));
}

function hasSignal(saju: SajuResult | undefined, token: string) {
  return (saju?.chart?.signals ?? []).some((signal) => signal.includes(token));
}

function buildPersonaBasis(seed: number, providerState: ProviderState, context?: PersonaBasisContext): PersonaNarrativeBasis {
  const ranked = sortedElementsByScore(context?.saju);
  const dominantElement = ranked[0]?.key ?? elementBySeed(seed + 1);
  const supportElement = ranked[1]?.key ?? elementBySeed(seed + 5);

  const personaTone: PersonaNarrativeBasis["personaTone"] = hasSignal(context?.saju, "PERSONA_TONE_WARM") || hasSignal(context?.saju, "RELATION_TONE_SOFT")
    ? "warm"
    : hasSignal(context?.saju, "PERSONA_TONE_CALM")
      ? "calm"
      : seed % 2 === 0
        ? "warm"
        : "calm";

  const appealAxis: PersonaNarrativeBasis["appealAxis"] = hasSignal(context?.saju, "EMOTION")
    ? "emotion-sync"
    : hasSignal(context?.saju, "RHYTHM") || hasSignal(context?.saju, "FLOW")
      ? "rhythm-sync"
      : hasSignal(context?.saju, "TRUST")
        ? "trust-build"
        : seed % 3 === 0
          ? "emotion-sync"
          : seed % 3 === 1
            ? "rhythm-sync"
            : "trust-build";

  const relationStyle: PersonaNarrativeBasis["relationStyle"] = hasSignal(context?.saju, "STRATEGIST")
    ? "strategist"
    : hasSignal(context?.saju, "MEDIATOR")
      ? "mediator"
      : dominantElement === "metal" || dominantElement === "earth"
        ? "strategist"
        : "mediator";

  return {
    dominantElement,
    supportElement,
    personaTone,
    appealAxis,
    relationStyle,
    basisCodes: buildBasisCodes(providerState, personaTone, relationStyle),
  };
}

function buildProvenance(providerState: ProviderState, ruleVersion: string, context?: PersonaBasisContext): NarrativeProvenance {
  return {
    providerState,
    chartSource: context?.saju?.chart?.calculationSource || chartSourceByState(providerState),
    ruleVersion: context?.saju?.chart?.ruleVersion || ruleVersion,
    isFallback: providerState !== "provider",
  };
}

function personaTitleFromBasis(basis: PersonaNarrativeBasis) {
  if (basis.relationStyle === "strategist" && basis.personaTone === "warm") {
    return basis.appealAxis === "emotion-sync" ? "온화한 리더형" : "온화한 기획형";
  }

  if (basis.relationStyle === "strategist") {
    if (basis.dominantElement === "metal") return "정밀 전략형";
    if (basis.dominantElement === "earth") return "안정 설계형";
    return "균형 전략형";
  }

  if (basis.personaTone === "warm") {
    if (basis.appealAxis === "rhythm-sync") return "리듬 공감형";
    if (basis.appealAxis === "trust-build") return "신뢰 공감형";
    return "감정 공명형";
  }

  if (basis.appealAxis === "emotion-sync") return "차분 공명형";
  if (basis.appealAxis === "trust-build") return "신중 신뢰형";
  if (basis.dominantElement === "water") return "깊은 교감형";
  return "차분 조율형";
}

function subtitleFromBasis(basis: PersonaNarrativeBasis) {
  if (basis.appealAxis === "emotion-sync") return "첫인상은 차분하고, 대화가 깊어질수록 매력이 선명해져요.";
  if (basis.appealAxis === "rhythm-sync") return "관계 속도를 무리하게 올리지 않아 안정감이 오래갑니다.";
  return "감정과 현실을 함께 보며 관계의 균형을 지키는 편이에요.";
}

function dominantElementLabel(element: PersonaNarrativeBasis["dominantElement"]) {
  const map = {
    wood: "주기운 · 목(木)",
    fire: "주기운 · 화(火)",
    earth: "주기운 · 토(土)",
    metal: "주기운 · 금(金)",
    water: "주기운 · 수(水)",
  } as const;
  return map[element];
}

function supportElementLabel(element: PersonaNarrativeBasis["supportElement"]) {
  const map = {
    wood: "보완기운 · 목(木)",
    fire: "보완기운 · 화(火)",
    earth: "보완기운 · 토(土)",
    metal: "보완기운 · 금(金)",
    water: "보완기운 · 수(水)",
  } as const;
  return map[element];
}

function buildTraits(basis: PersonaNarrativeBasis): PersonaTraits {
  const ageRange = basis.personaTone === "warm" ? "27~33세" : "29~35세";

  const personality = basis.personaTone === "warm"
    ? "따뜻하지만 기준이 분명한 성향"
    : "차분하고 관찰력이 좋은 성향";

  const career = basis.relationStyle === "strategist"
    ? "연구·분석·전략 분야"
    : "서비스·운영·기획 분야";

  const appearance = basis.personaTone === "warm"
    ? "부드럽고 단정한 분위기"
    : "차분하고 지적인 분위기";

  return {
    ageRange,
    personality: trimSentence(personality, 24),
    career: trimSentence(career, 24),
    appearance: trimSentence(appearance, 22),
  };
}

function appealPointFromBasis(basis: PersonaNarrativeBasis) {
  if (basis.appealAxis === "emotion-sync") return "궁합 포인트 · 말의 온도를 맞추면 매력이 더 자연스럽게 보여요.";
  if (basis.appealAxis === "rhythm-sync") return "궁합 포인트 · 약속 리듬이 맞으면 관계가 안정적으로 깊어져요.";
  return "궁합 포인트 · 감정 표현 타이밍을 맞추면 신뢰가 빠르게 쌓여요.";
}

export function buildMockPersonaNarrative(input: UserProfileInput, providerState: ProviderState, context?: PersonaBasisContext): PersonaNarrativeSnapshot {
  const seed = seedFromProfile(input);
  const basis = buildPersonaBasis(seed, providerState, context);
  const provenance = buildProvenance(providerState, PERSONA_RULE_VERSION, context);
  const ruleVersion = provenance.ruleVersion || PERSONA_RULE_VERSION;

  return {
    providerState,
    personaTitle: personaTitleFromBasis(basis),
    personaSubtitle: trimSentence(subtitleFromBasis(basis), 38),
    personaTraits: buildTraits(basis),
    dominantElement: dominantElementLabel(basis.dominantElement),
    supportElement: supportElementLabel(basis.supportElement),
    appealPoint: trimSentence(appealPointFromBasis(basis), 42),
    basisLabel: basisLabelByState(providerState),
    basisCodes: basis.basisCodes,
    confidence: confidenceByState(providerState),
    ruleVersion,
    provenance,
    basis,
  };
}
