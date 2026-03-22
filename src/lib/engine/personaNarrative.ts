import type { ProviderState, SajuResult } from "./types";
import type { ElementKey, SajuAnalysis, UserProfileInput } from "../../types/saju";
import type { NarrativeProvenance } from "./homeNarrative";
import { classifyPersonaType, type PersonaTypeResult } from "./personaClassifier";
import {
  elementLabel,
  getAnalysisIdentityLabel,
  getAnalysisReactionLine,
  polishNarrativeLine,
  getStrengthLabel,
  getWeakElementCareLine,
  isChartDerivedAnalysis,
  joinElementLabels,
} from "../sajuAnalysis";

export type PersonaNarrativeConfidence = "high" | "medium" | "low";

export interface PersonaTraits {
  relationTempo: string;
  attractionStyle: string;
  stableRhythm: string;
  cautionPoint: string;
}

export interface PersonaNarrativeBasis {
  dominantElement: ElementKey;
  supportElement: ElementKey;
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
  personaType?: PersonaTypeResult;
}

const PERSONA_RULE_VERSION = "persona-v3";

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

function trimSentence(value: string, cap = 96) {
  if (!value) return "분석 중인 명식이라 한 호흡 쉬어가며 읽어 주세요.";
  const normalized = value.replace(/\s+/g, " ").trim();
  if (normalized.length <= cap) return normalized;

  const sliced = normalized.slice(0, cap).trim();
  const safeBoundary = sliced.replace(/\s+\S*$/, "").trim();
  const finalText = safeBoundary.length >= Math.floor(cap * 0.6) ? safeBoundary : sliced;

  if (/[.!?…]$/.test(finalText)) return finalText;
  return `${finalText}…`;
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
  if (providerState === "provider") return "실제 명식 신호 기준";
  if (providerState === "mock-fallback") return "부분 fallback 해석";
  return "기본 mock 해석";
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
  const analysis = context?.saju?.profile.analysis;
  const dominantElement = analysis?.dominantElement ?? ranked[0]?.key ?? elementBySeed(seed + 1);
  const supportElement = analysis?.usefulElements[0] ?? ranked[1]?.key ?? elementBySeed(seed + 5);

  const personaTone: PersonaNarrativeBasis["personaTone"] = hasSignal(context?.saju, "PERSONA_TONE_WARM") || hasSignal(context?.saju, "RELATION_TONE_SOFT")
    ? "warm"
    : hasSignal(context?.saju, "PERSONA_TONE_CALM")
      ? "calm"
      : analysis?.strengthLevel === "weak" || analysis?.dayMasterElement === "water"
        ? "warm"
        : analysis?.strengthLevel === "strong" || analysis?.dayMasterElement === "metal"
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
        : analysis?.usefulElements.includes("water")
          ? "emotion-sync"
          : analysis?.usefulElements.includes("wood") || analysis?.usefulElements.includes("fire")
            ? "rhythm-sync"
            : analysis?.usefulElements.includes("earth") || analysis?.usefulElements.includes("metal")
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
      : analysis?.strengthLevel === "strong"
        ? "strategist"
        : analysis?.strengthLevel === "weak"
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

function personaTitleFromBasis(seed: number, basis: PersonaNarrativeBasis, confidence: PersonaNarrativeConfidence) {
  const basisSeed = `${basis.personaTone}:${basis.relationStyle}:${basis.appealAxis}:${basis.dominantElement}:${basis.supportElement}:${confidence}`
    .split("")
    .reduce((sum, ch) => sum + ch.charCodeAt(0), seed);

  if (basis.relationStyle === "strategist" && basis.personaTone === "warm") {
    const options = basis.appealAxis === "emotion-sync" ? ["온화한 리더형", "감성 기획형", "공감 리드형"] : ["온화한 기획형", "균형 리드형", "신뢰 운영형"];
    return pick(basisSeed + 53, options);
  }

  if (basis.relationStyle === "strategist") {
    if (basis.dominantElement === "metal") return pick(basisSeed + 59, ["정밀 전략형", "기준 설계형", "규칙 최적화형"]);
    if (basis.dominantElement === "earth") return pick(basisSeed + 61, ["안정 설계형", "현실 조율형", "지속 운영형"]);
    return pick(basisSeed + 67, ["균형 전략형", "이성 기획형", "구조화 리더형"]);
  }

  if (basis.personaTone === "warm") {
    if (basis.appealAxis === "rhythm-sync") return pick(basisSeed + 71, ["리듬 공감형", "생활 호흡형", "템포 조율형"]);
    if (basis.appealAxis === "trust-build") return pick(basisSeed + 73, ["신뢰 공감형", "따뜻한 안정형", "관계 축적형"]);
    return pick(basisSeed + 79, ["감정 공명형", "표현 공감형", "정서 교감형"]);
  }

  if (basis.appealAxis === "emotion-sync") return pick(basisSeed + 83, ["차분 공명형", "섬세 교감형", "잔잔 공감형"]);
  if (basis.appealAxis === "trust-build") return pick(basisSeed + 89, ["신중 신뢰형", "균형 신뢰형", "관계 안정형"]);
  if (basis.dominantElement === "water") return pick(basisSeed + 97, ["깊은 교감형", "정서 탐색형", "내면 연결형"]);
  return pick(basisSeed + 101, ["차분 조율형", "안정 조율형", "침착 균형형"]);
}

function subtitleFromBasis(seed: number, basis: PersonaNarrativeBasis, confidence: PersonaNarrativeConfidence) {
  const poolByAxis: Record<PersonaNarrativeBasis["appealAxis"], string[]> = {
    "emotion-sync": [
      "첫인상은 차분하고, 대화가 깊어질수록 매력이 선명해져요.",
      "감정 결을 잘 읽어 관계가 깊어질수록 신뢰가 커져요.",
      "말보다 분위기에서 진심이 먼저 전달되는 타입이에요.",
    ],
    "rhythm-sync": [
      "관계 속도를 무리하게 올리지 않아 안정감이 오래가요.",
      "생활 템포가 맞을수록 장점이 더 분명하게 보이는 편이에요.",
      "약속 간격을 맞추면 관계가 한결 안정돼요.",
    ],
    "trust-build": [
      "감정과 현실을 함께 보며 관계의 균형을 지키는 편이에요.",
      "약속과 일관성에서 신뢰를 빠르게 쌓는 타입이에요.",
      "천천히 신뢰를 쌓지만 한번 가까워지면 깊게 이어져요.",
    ],
  };

  const elementNudge: Record<PersonaNarrativeBasis["dominantElement"], string[]> = {
    wood: ["성장형 관계에서 매력이 더 빠르게 드러나요.", "함께 배우는 환경에서 눈에 더 잘 띄어요.", "목 기운 덕분에 발전형 관계에서 시너지가 커요."],
    fire: ["표현력이 살아나는 순간에 호감 전환이 빨라요.", "대화 온도를 올리는 장점이 분명해요.", "화 기운이 강해 첫인상 에너지가 선명해요."],
    earth: ["안정감을 주는 태도가 장기 관계 강점이에요.", "신뢰를 쌓는 속도가 꾸준한 타입이에요.", "토 기운이 강해 관계 유지력이 높은 편이에요."],
    metal: ["기준을 정리해주는 능력이 관계 품질을 올려요.", "약속/원칙을 지키는 면이 큰 신뢰를 줘요.", "금 기운 영향으로 경계선 설정이 깔끔해요."],
    water: ["깊은 공감 대화에서 매력이 가장 크게 보여요.", "상대 감정을 읽는 정교함이 돋보여요.", "수 기운 덕분에 정서 해석력이 뛰어나요."],
  };

  const nuancePool: Record<PersonaNarrativeBasis["relationStyle"], string[]> = {
    strategist: ["관계를 구조적으로 설계하는 능력이 강해요.", "기준을 정하면 안정감이 빠르게 올라가요.", "현실 감각이 관계 품질을 높여줘요."],
    mediator: ["상대 감정을 부드럽게 연결하는 강점이 있어요.", "대화 완충 능력이 갈등을 줄여줘요.", "관계 온도 조절에 능숙한 편이에요."],
  };

  const basisSeed = `${basis.personaTone}:${basis.appealAxis}:${basis.dominantElement}:${basis.supportElement}:${basis.relationStyle}:${confidence}`
    .split("")
    .reduce((sum, ch) => sum + ch.charCodeAt(0), seed);

  const axisLine = pick(basisSeed + 29, poolByAxis[basis.appealAxis]);
  const elementLine = pick(basisSeed + 31, elementNudge[basis.dominantElement]);
  const nuanceLine = pick(basisSeed + 33, nuancePool[basis.relationStyle]);
  return `${axisLine} ${elementLine} ${nuanceLine}`;
}

function dominantElementLabel(element: PersonaNarrativeBasis["dominantElement"]) {
  return `주 기운 · ${elementLabel(element)}`;
}

function supportElementLabel(element: PersonaNarrativeBasis["supportElement"]) {
  return `보완 기운 · ${elementLabel(element)}`;
}

function roleWord(basis: PersonaNarrativeBasis) {
  if (basis.relationStyle === "strategist" && basis.personaTone === "warm") return "온기 리드형";
  if (basis.relationStyle === "strategist") return "구조 리드형";
  if (basis.personaTone === "warm") return "공감 조율형";
  return "안정 조율형";
}

function axisWord(axis: PersonaNarrativeBasis["appealAxis"]) {
  if (axis === "emotion-sync") return "감정 공명";
  if (axis === "rhythm-sync") return "리듬 합";
  return "신뢰 축";
}

function analysisTitle(analysis: SajuAnalysis, basis: PersonaNarrativeBasis) {
  return `${getAnalysisIdentityLabel(analysis)} ${roleWord(basis)}`;
}

function analysisSubtitle(analysis: SajuAnalysis, basis: PersonaNarrativeBasis, confidence: PersonaNarrativeConfidence) {
  const usefulLabel = joinElementLabels(analysis.usefulElements);
  const providerLead = analysis.basisOrigin === "provider" ? polishNarrativeLine(analysis.summaryLines[0] ?? "", analysis) : "";
  const subtitleLead = isChartDerivedAnalysis(analysis)
    ? `${getStrengthLabel(analysis.strengthLevel)} 타입이라`
    : `${getStrengthLabel(analysis.strengthLevel)} 타입이라`;
  const confidenceTail = confidence === "high"
    ? "지금 명식과의 연결감도 높은 편이에요."
    : confidence === "medium"
      ? "일부는 fallback이지만 해석 축은 유지되고 있어요."
      : "지금은 방향성 위주로 참고해 주세요.";

  return trimSentence(
    `${providerLead ? `${providerLead} ` : ""}${subtitleLead} ${usefulLabel} 감각이 통하는 사람 앞에서 매력이 더 또렷하게 보여요. ${axisWord(basis.appealAxis)}이 살아나는 장면에서 좋은 인상이 오래 남아요. ${confidenceTail}`,
  );
}

function buildTraits(seed: number, basis: PersonaNarrativeBasis, confidence: PersonaNarrativeConfidence, analysis?: SajuAnalysis): PersonaTraits {
  const confidenceTail = confidence === "high"
    ? "지금 구조에선 바로 체감되기 쉬운 축이에요."
    : confidence === "medium"
      ? "상황에 따라 강도는 조금 달라질 수 있어요."
      : "가볍게 방향성 정도로 받아들이면 좋아요.";

  if (analysis) {
    const usefulLabel = joinElementLabels(analysis.usefulElements);
    const supportLabel = joinElementLabels(analysis.supportElements);
    const cautionLabel = joinElementLabels(analysis.cautionElements);

    return {
      relationTempo: trimSentence(
        analysis.strengthLevel === "strong"
          ? "첫 분위기를 잡는 속도는 빠른 편이지만, 관계 깊이는 한 박자 쉬며 맞출 때 훨씬 안정적이에요."
          : analysis.strengthLevel === "weak"
            ? "빠른 진전보다 마음을 확인하며 천천히 가까워질 때 편안함이 커져요."
            : "호흡이 맞기 시작하면 거리감이 빠르게 줄고, 억지로 당기지 않을수록 매력이 오래 가요.",
      ),
      attractionStyle: trimSentence(
        `${basis.personaTone === "warm" ? "부드럽지만 상대 반응을 읽는 말투" : "정리된 말과 안정적인 반응"}가 가장 큰 매력 포인트예요. ${usefulLabel} 감각이 잘 살아나는 장면에서 특히 더 자연스럽게 보여요. ${confidenceTail}`,
      ),
      stableRhythm: trimSentence(
        `${basis.relationStyle === "strategist" ? "예측 가능한 약속과 일정" : "감정 확인이 가능한 대화"}가 이어질 때 마음이 훨씬 편해져요. ${supportLabel}이 받쳐 주는 환경일수록 장점도 오래가요.`,
      ),
      cautionPoint: trimSentence(
        `${cautionLabel} 성향이 과하게 올라오면 ${analysis.strengthLevel === "strong" ? "주도권을 너무 빨리 쥐려는 인상" : "상대 반응에 쉽게 흔들리는 모습"}으로 보일 수 있어요. ${getWeakElementCareLine(analysis.weakestElement)}`,
      ),
    };
  }

  const fallbackTempo = basis.personaTone === "warm"
    ? ["천천히 온도를 맞추며 가까워지는 편이에요.", "초반엔 부드럽게, 익숙해질수록 장점이 더 잘 보여요."]
    : ["서두르기보다 기준을 확인하며 가까워지는 편이에요.", "리듬과 안정감을 먼저 확인할 때 장점이 더 선명해져요."];

  const fallbackAppeal = basis.appealAxis === "emotion-sync"
    ? ["상대 마음의 결을 읽는 반응이 매력으로 이어져요.", "감정을 섬세하게 읽어 주는 태도가 강점이에요."]
    : basis.appealAxis === "rhythm-sync"
      ? ["생활 템포가 맞을수록 장점이 더 분명하게 보여요.", "호흡이 맞는 관계에서 매력이 더 선명해져요."]
      : ["신뢰를 차곡차곡 쌓는 방식이 가장 큰 무기예요.", "작은 약속을 지키는 태도가 오래 기억돼요."];

  const fallbackRhythm = basis.relationStyle === "strategist"
    ? ["예측 가능한 일정과 계획이 있을 때 마음이 놓여요.", "기준이 정리된 환경에서 관계가 차분하게 이어져요."]
    : ["감정 확인이 오가는 대화가 이어질 때 안정감이 생겨요.", "관계의 속도를 함께 조율할 수 있을 때 마음이 놓여요."];

  const fallbackCaution = basis.personaTone === "warm"
    ? ["상대 기분에 너무 맞추다 보면 내 리듬을 놓칠 수 있어요.", "분위기를 살피느라 하고 싶은 말을 미루지 않는 게 좋아요."]
    : ["기준을 너무 앞세우면 차갑게 보일 수 있어요.", "정리된 말이 장점이지만 단정적으로 들리지 않게 톤을 풀어 주세요."];

  return {
    relationTempo: trimSentence(pick(seed + 31, fallbackTempo)),
    attractionStyle: trimSentence(`${pick(seed + 37, fallbackAppeal)} ${confidenceTail}`),
    stableRhythm: trimSentence(pick(seed + 41, fallbackRhythm)),
    cautionPoint: trimSentence(pick(seed + 43, fallbackCaution)),
  };
}

function analysisAppealPoint(analysis: SajuAnalysis, basis: PersonaNarrativeBasis, confidence: PersonaNarrativeConfidence) {
  const usefulLabel = joinElementLabels(analysis.usefulElements);
  const tail = confidence === "high"
    ? "현재 입력 기준에서 가장 신뢰도가 높은 매력 축이에요."
    : confidence === "medium"
      ? "일부 보정이 있어도 흐름상 이 축이 가장 선명해요."
      : "지금은 가볍게 관계 방향을 보는 힌트로 읽어 주세요.";

  return trimSentence(
    `${polishNarrativeLine(getAnalysisReactionLine(analysis), analysis)} ${usefulLabel} 감각이 통하는 사람 앞에서는 표정과 반응이 한결 자연스러워져요. ${basis.appealAxis === "emotion-sync" ? "감정의 결을 읽어 주는 순간" : basis.appealAxis === "rhythm-sync" ? "일상 템포가 맞아드는 순간" : "신뢰가 차곡차곡 쌓이는 순간"}에 매력이 가장 또렷하게 보여요. ${tail}`,
  );
}

function appealPointFromBasis(seed: number, basis: PersonaNarrativeBasis, confidence: PersonaNarrativeConfidence) {
  const poolByAxis: Record<PersonaNarrativeBasis["appealAxis"], string[]> = {
    "emotion-sync": [
      "상대 마음의 결을 읽어 주는 반응이 관계의 온도를 빠르게 올려 줘요.",
      "감정 확인 한 문장이 관계 흐름을 부드럽게 열어 줘요.",
    ],
    "rhythm-sync": [
      "생활 템포와 대화 간격이 맞을수록 장점이 더 또렷하게 보여요.",
      "리듬이 맞는 관계에서 편안한 매력이 더 크게 드러나요.",
    ],
    "trust-build": [
      "작은 약속을 지키는 태도가 오래 가는 신뢰를 만들어 줘요.",
      "감정보다 신뢰를 먼저 쌓는 방식이 가장 큰 장점이에요.",
    ],
  };

  const confidenceTail = confidence === "high"
    ? "현재 구조상 바로 체감되기 쉬운 장점이에요."
    : confidence === "medium"
      ? "상황에 따라 강도는 달라도 핵심 축은 유지돼요."
      : "지금은 방향성 정도로 가볍게 참고해 주세요.";

  return trimSentence(`${pick(seed + 47, poolByAxis[basis.appealAxis])} ${confidenceTail}`);
}

export function buildMockPersonaNarrative(input: UserProfileInput, providerState: ProviderState, context?: PersonaBasisContext): PersonaNarrativeSnapshot {
  const seed = seedFromProfile(input);
  const basis = buildPersonaBasis(seed, providerState, context);
  const provenance = buildProvenance(providerState, PERSONA_RULE_VERSION, context);
  const ruleVersion = provenance.ruleVersion || PERSONA_RULE_VERSION;
  const confidence = confidenceByState(providerState);
  const personaType = classifyPersonaType(basis, confidence);
  const analysis = context?.saju?.profile.analysis;

  return {
    providerState,
    personaTitle: analysis ? analysisTitle(analysis, basis) : personaType.title || personaTitleFromBasis(seed, basis, confidence),
    personaSubtitle: analysis ? analysisSubtitle(analysis, basis, confidence) : trimSentence(personaType.subtitle || subtitleFromBasis(seed, basis, confidence), 84),
    personaTraits: buildTraits(seed, basis, confidence, analysis),
    dominantElement: dominantElementLabel(basis.dominantElement),
    supportElement: supportElementLabel(basis.supportElement),
    appealPoint: analysis ? analysisAppealPoint(analysis, basis, confidence) : appealPointFromBasis(seed, basis, confidence),
    basisLabel: basisLabelByState(providerState),
    basisCodes: basis.basisCodes,
    confidence,
    ruleVersion,
    provenance,
    basis,
    personaType,
  };
}
