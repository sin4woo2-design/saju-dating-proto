import type { ProviderState, SajuResult } from "./types";
import type { UserProfileInput } from "../../types/saju";
import type { NarrativeProvenance } from "./homeNarrative";
import { pickWithRecencyGuard } from "./variationMemory";

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

function getRotationNonce(input: UserProfileInput) {
  if (typeof window === "undefined") return 0;

  const today = new Date().toISOString().slice(0, 10);
  const key = `persona-narrative-rotation:${input.birthDate}:${input.birthTime}:${input.gender}:${today}`;

  const current = Number(window.localStorage.getItem(key) || "0");
  const next = (current + 1) % 17;
  window.localStorage.setItem(key, String(next));
  return next;
}

function seedFromProfile(input: UserProfileInput) {
  const now = new Date();
  const today = now.toISOString().slice(0, 10);
  const hourBucket = Math.floor(now.getUTCHours() / 3);
  return `${input.birthDate}-${input.birthTime}-${input.gender}-${today}-h${hourBucket}`
    .split("")
    .reduce((sum, ch) => sum + ch.charCodeAt(0), 0);
}

function pick<T>(seed: number, list: readonly T[]) {
  return list[seed % list.length];
}

function trimSentence(value: string, cap = 84) {
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

function personaTitleFromBasis(seed: number, basis: PersonaNarrativeBasis, confidence: PersonaNarrativeConfidence, rotation: number) {
  const bucket = `${basis.personaTone}:${basis.relationStyle}:${basis.appealAxis}:${basis.dominantElement}:${basis.supportElement}:${confidence}`;

  if (basis.relationStyle === "strategist" && basis.personaTone === "warm") {
    const options = basis.appealAxis === "emotion-sync" ? ["온화한 리더형", "감성 기획형", "공감 리드형"] : ["온화한 기획형", "균형 리드형", "신뢰 운영형"];
    return pickWithRecencyGuard(options, seed + 53 + rotation, (v) => String(v), "persona-title", bucket);
  }

  if (basis.relationStyle === "strategist") {
    if (basis.dominantElement === "metal") return pickWithRecencyGuard(["정밀 전략형", "기준 설계형", "규칙 최적화형"], seed + 59 + rotation, (v) => String(v), "persona-title", bucket);
    if (basis.dominantElement === "earth") return pickWithRecencyGuard(["안정 설계형", "현실 조율형", "지속 운영형"], seed + 61 + rotation, (v) => String(v), "persona-title", bucket);
    return pickWithRecencyGuard(["균형 전략형", "이성 기획형", "구조화 리더형"], seed + 67 + rotation, (v) => String(v), "persona-title", bucket);
  }

  if (basis.personaTone === "warm") {
    if (basis.appealAxis === "rhythm-sync") return pickWithRecencyGuard(["리듬 공감형", "생활 호흡형", "템포 조율형"], seed + 71 + rotation, (v) => String(v), "persona-title", bucket);
    if (basis.appealAxis === "trust-build") return pickWithRecencyGuard(["신뢰 공감형", "따뜻한 안정형", "관계 축적형"], seed + 73 + rotation, (v) => String(v), "persona-title", bucket);
    return pickWithRecencyGuard(["감정 공명형", "표현 공감형", "정서 교감형"], seed + 79 + rotation, (v) => String(v), "persona-title", bucket);
  }

  if (basis.appealAxis === "emotion-sync") return pickWithRecencyGuard(["차분 공명형", "섬세 교감형", "잔잔 공감형"], seed + 83 + rotation, (v) => String(v), "persona-title", bucket);
  if (basis.appealAxis === "trust-build") return pickWithRecencyGuard(["신중 신뢰형", "균형 신뢰형", "관계 안정형"], seed + 89 + rotation, (v) => String(v), "persona-title", bucket);
  if (basis.dominantElement === "water") return pickWithRecencyGuard(["깊은 교감형", "정서 탐색형", "내면 연결형"], seed + 97 + rotation, (v) => String(v), "persona-title", bucket);
  return pickWithRecencyGuard(["차분 조율형", "안정 조율형", "침착 균형형"], seed + 101 + rotation, (v) => String(v), "persona-title", bucket);
}

function subtitleFromBasis(seed: number, basis: PersonaNarrativeBasis, confidence: PersonaNarrativeConfidence, rotation: number) {
  const poolByAxis: Record<PersonaNarrativeBasis["appealAxis"], string[]> = {
    "emotion-sync": [
      "첫인상은 차분하고, 대화가 깊어질수록 매력이 선명해져요.",
      "감정 결을 잘 읽어 관계가 깊어질수록 신뢰가 커져요.",
      "말보다 분위기에서 진심이 먼저 전달되는 타입이에요.",
    ],
    "rhythm-sync": [
      "관계 속도를 무리하게 올리지 않아 안정감이 오래갑니다.",
      "생활 리듬이 맞을수록 매력이 더 또렷해지는 편이에요.",
      "약속 템포를 맞추면 관계 만족도가 크게 올라가요.",
    ],
    "trust-build": [
      "감정과 현실을 함께 보며 관계의 균형을 지키는 편이에요.",
      "약속과 일관성에서 신뢰를 빠르게 쌓는 타입이에요.",
      "천천히 신뢰를 쌓지만 한번 가까워지면 깊게 이어져요.",
    ],
  };

  const elementNudge: Record<PersonaNarrativeBasis["dominantElement"], string[]> = {
    wood: ["성장형 관계에서 매력이 더 빠르게 드러나요.", "함께 배우는 환경에서 존재감이 커져요.", "목 기운 덕분에 발전형 관계에서 시너지가 커요."],
    fire: ["표현력이 살아나는 순간에 호감 전환이 빨라요.", "대화 온도를 올리는 장점이 분명해요.", "화 기운이 강해 첫인상 에너지가 선명해요."],
    earth: ["안정감을 주는 태도가 장기 관계 강점이에요.", "신뢰를 쌓는 속도가 꾸준한 타입이에요.", "토 기운이 강해 관계 유지력이 높은 편이에요."],
    metal: ["기준을 정리해주는 능력이 관계 품질을 올려요.", "약속/원칙을 지키는 면이 큰 신뢰를 줘요.", "금 기운 영향으로 경계선 설정이 깔끔해요."],
    water: ["깊은 공감 대화에서 매력이 가장 크게 보여요.", "상대 감정을 읽는 정교함이 돋보여요.", "수 기운 덕분에 정서 해석력이 뛰어나요."],
  };

  const bucket = `${basis.personaTone}:${basis.appealAxis}:${basis.dominantElement}:${basis.supportElement}:${confidence}`;
  const nuancePool: Record<PersonaNarrativeBasis["relationStyle"], string[]> = {
    strategist: ["관계를 구조적으로 설계하는 능력이 강해요.", "기준을 정하면 안정감이 빠르게 올라가요.", "현실 감각이 관계 품질을 높여줘요."],
    mediator: ["상대 감정을 부드럽게 연결하는 강점이 있어요.", "대화 완충 능력이 갈등을 줄여줘요.", "관계 온도 조절이 자연스러운 편이에요."],
  };

  const axisLine = pickWithRecencyGuard(poolByAxis[basis.appealAxis], seed + 29 + rotation, (v) => String(v), "persona-subtitle-axis", bucket);
  const elementLine = pickWithRecencyGuard(elementNudge[basis.dominantElement], seed + 31 + rotation, (v) => String(v), "persona-subtitle-element", bucket);
  const nuanceLine = pickWithRecencyGuard(nuancePool[basis.relationStyle], seed + 33 + rotation, (v) => String(v), "persona-subtitle-nuance", bucket);
  return `${axisLine} ${elementLine} ${nuanceLine}`;
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

function buildTraits(seed: number, basis: PersonaNarrativeBasis, confidence: PersonaNarrativeConfidence, rotation: number): PersonaTraits {
  const ageRangePool = basis.personaTone === "warm"
    ? ["26~32세", "27~33세", "28~34세"]
    : ["29~35세", "30~36세", "28~35세"];

  const personalityPool = basis.personaTone === "warm"
    ? [
        "따뜻하지만 기준이 분명한 성향",
        "배려가 자연스럽고 감정 리듬을 잘 맞추는 성향",
        "표현은 부드럽지만 판단은 선명한 성향",
      ]
    : [
        "차분하고 관찰력이 좋은 성향",
        "감정보다 맥락을 먼저 읽는 신중한 성향",
        "침착하게 상황을 정리하는 안정형 성향",
      ];

  const careerPool = basis.relationStyle === "strategist"
    ? ["연구·분석·전략 분야", "기획·데이터·운영 전략 분야", "재무·정책·컨설팅 분야"]
    : ["서비스·운영·기획 분야", "브랜드·콘텐츠·커뮤니케이션 분야", "교육·케어·매니징 분야"];

  const appearancePool = basis.personaTone === "warm"
    ? ["부드럽고 단정한 분위기", "온화하고 편안한 인상", "밝고 친근한 첫인상"]
    : ["차분하고 지적인 분위기", "정돈되고 신뢰감 있는 인상", "조용하지만 집중감 있는 인상"];

  const confidenceTail = confidence === "high"
    ? ["(근거 신호가 충분한 편)", "(해석 안정성이 높은 편)"]
    : confidence === "medium"
      ? ["(핵심 흐름 위주 해석)", "(일부 보정 포함)"]
      : ["(보수적 해석 권장)", "(참고용 흐름 중심)"];

  return {
    ageRange: pick(seed + 31 + rotation, ageRangePool),
    personality: trimSentence(`${pick(seed + 37 + rotation, personalityPool)} ${pick(seed + 44 + rotation, confidenceTail)}`, 84),
    career: trimSentence(pick(seed + 41 + rotation, careerPool), 84),
    appearance: trimSentence(pick(seed + 43 + rotation, appearancePool), 84),
  };
}

function appealPointFromBasis(seed: number, basis: PersonaNarrativeBasis, confidence: PersonaNarrativeConfidence, rotation: number) {
  const poolByAxis: Record<PersonaNarrativeBasis["appealAxis"], string[]> = {
    "emotion-sync": [
      "궁합 포인트 · 말의 온도를 맞추면 매력이 더 자연스럽게 보여요.",
      "궁합 포인트 · 감정 확인 한 문장이 관계 온도를 크게 올려줘요.",
      "궁합 포인트 · 섬세한 리액션이 신뢰를 빠르게 만들어요.",
    ],
    "rhythm-sync": [
      "궁합 포인트 · 약속 리듬이 맞으면 관계가 안정적으로 깊어져요.",
      "궁합 포인트 · 연락 주기 합의만 해도 갈등이 크게 줄어요.",
      "궁합 포인트 · 생활 템포가 맞으면 애정 표현도 자연스러워져요.",
    ],
    "trust-build": [
      "궁합 포인트 · 감정 표현 타이밍을 맞추면 신뢰가 빠르게 쌓여요.",
      "궁합 포인트 · 작은 약속을 지키는 패턴이 매력을 키워줘요.",
      "궁합 포인트 · 현실 계획을 함께 세우면 관계 안정감이 커져요.",
    ],
  };

  const confidenceNudge = confidence === "high"
    ? ["핵심 신호와의 정합성이 높아요."]
    : confidence === "medium"
      ? ["상황에 따라 강도가 달라질 수 있어요."]
      : ["큰 흐름 가이드로 참고해 주세요."];

  return `${pick(seed + 47 + rotation, poolByAxis[basis.appealAxis])} ${pick(seed + 49 + rotation, confidenceNudge)}`;
}

export function buildMockPersonaNarrative(input: UserProfileInput, providerState: ProviderState, context?: PersonaBasisContext): PersonaNarrativeSnapshot {
  const seed = seedFromProfile(input);
  const basis = buildPersonaBasis(seed, providerState, context);
  const provenance = buildProvenance(providerState, PERSONA_RULE_VERSION, context);
  const ruleVersion = provenance.ruleVersion || PERSONA_RULE_VERSION;
  const confidence = confidenceByState(providerState);
  const rotation = getRotationNonce(input);

  return {
    providerState,
    personaTitle: personaTitleFromBasis(seed, basis, confidence, rotation),
    personaSubtitle: trimSentence(subtitleFromBasis(seed, basis, confidence, rotation), 84),
    personaTraits: buildTraits(seed, basis, confidence, rotation),
    dominantElement: dominantElementLabel(basis.dominantElement),
    supportElement: supportElementLabel(basis.supportElement),
    appealPoint: trimSentence(appealPointFromBasis(seed, basis, confidence, rotation), 84),
    basisLabel: basisLabelByState(providerState),
    basisCodes: basis.basisCodes,
    confidence,
    ruleVersion,
    provenance,
    basis,
  };
}
