import type { ProviderState } from "./types";
import type { UserProfileInput } from "../../types/saju";

export type NarrativeConfidence = "high" | "medium" | "low";

export interface HomeTodayPoints {
  conversation: string;
  wealth: string;
  caution: string;
}

export interface HomeTimeFlow {
  morning: string;
  afternoon: string;
  evening: string;
}

export interface NarrativeProvenance {
  providerState: ProviderState;
  chartSource: string;
  ruleVersion: string;
  isFallback: boolean;
}

export interface HomeNarrativeBasis {
  dominantElement: "wood" | "fire" | "earth" | "metal" | "water";
  supportElement: "wood" | "fire" | "earth" | "metal" | "water";
  flowBias: "afternoon-peak" | "steady-day";
  relationTone: "soft" | "clear";
  focusWindow: "morning-setup" | "afternoon-focus" | "evening-wrap";
  basisCodes: string[];
}

export interface HomeNarrativeSnapshot {
  providerState: ProviderState;
  heroLead: string;
  heroSupport: string;
  todaySummary: [string, string, string];
  todayPoints: HomeTodayPoints;
  timeFlow: HomeTimeFlow;
  confidence: NarrativeConfidence;
  basisLabel: string;
  basisCodes: string[];
  ruleVersion: string;
  provenance: NarrativeProvenance;
  basis: HomeNarrativeBasis;
}

const HOME_RULE_VERSION = "home-v1";

function seedFromProfile(input: UserProfileInput) {
  const today = new Date().toISOString().slice(0, 10);
  return `${input.birthDate}-${input.birthTime}-${input.gender}-${today}`
    .split("")
    .reduce((sum, ch) => sum + ch.charCodeAt(0), 0);
}

function pick<T>(seed: number, list: readonly T[]): T {
  return list[seed % list.length];
}

function trimSentence(value: string, cap = 31) {
  if (!value) return "흐름 데이터를 정리 중이에요.";
  if (value.length <= cap) return value;
  const sliced = value.slice(0, cap).trim();
  return sliced.endsWith(".") ? sliced : `${sliced}.`;
}

function uniqueLine(value: string, used: Set<string>, fallback: string) {
  const normalized = (value || "").replace(/\s+/g, " ").trim();
  const safeValue = normalized || fallback;

  if (!used.has(safeValue)) {
    used.add(safeValue);
    return safeValue;
  }

  const alt = fallback.replace(/\s+/g, " ").trim();
  used.add(alt);
  return alt;
}

function chartSourceByState(providerState: ProviderState) {
  if (providerState === "provider") return "provider";
  if (providerState === "mock-fallback") return "mock-fallback";
  return "mock";
}

function confidenceByState(providerState: ProviderState): NarrativeConfidence {
  if (providerState === "provider") return "high";
  if (providerState === "mock-fallback") return "medium";
  return "low";
}

function basisLabelByState(providerState: ProviderState) {
  if (providerState === "provider") return "실시간 사주 해석";
  if (providerState === "mock-fallback") return "부분 fallback 해석";
  return "기본 mock 해석";
}

function elementBySeed(seed: number): HomeNarrativeBasis["dominantElement"] {
  const elements: HomeNarrativeBasis["dominantElement"][] = ["wood", "fire", "earth", "metal", "water"];
  return pick(seed, elements);
}

function buildBasisCodes(providerState: ProviderState, relationTone: HomeNarrativeBasis["relationTone"], flowBias: HomeNarrativeBasis["flowBias"]) {
  const toneCode = relationTone === "soft" ? "RELATION_TONE_SOFT" : "RELATION_TONE_CLEAR";
  const flowCode = flowBias === "afternoon-peak" ? "FLOW_AFTERNOON_PEAK" : "FLOW_STEADY_DAY";

  if (providerState === "provider") return ["CHART_SIGNAL", "DAILY_FLOW", toneCode, flowCode];
  if (providerState === "mock-fallback") return ["PROVIDER_PARTIAL_DATA", "MOCK_NARRATIVE_FALLBACK", toneCode, flowCode];
  return ["MOCK_NARRATIVE_V1", toneCode, flowCode];
}

function buildHomeBasis(seed: number, providerState: ProviderState): HomeNarrativeBasis {
  const dominantElement = elementBySeed(seed + 1);
  const supportElement = elementBySeed(seed + 3);
  const flowBias: HomeNarrativeBasis["flowBias"] = seed % 3 === 0 ? "afternoon-peak" : "steady-day";
  const relationTone: HomeNarrativeBasis["relationTone"] = seed % 2 === 0 ? "soft" : "clear";
  const focusWindow: HomeNarrativeBasis["focusWindow"] = seed % 5 === 0 ? "morning-setup" : seed % 5 <= 2 ? "afternoon-focus" : "evening-wrap";

  return {
    dominantElement,
    supportElement,
    flowBias,
    relationTone,
    focusWindow,
    basisCodes: buildBasisCodes(providerState, relationTone, flowBias),
  };
}

function buildProvenance(providerState: ProviderState, ruleVersion: string): NarrativeProvenance {
  return {
    providerState,
    chartSource: chartSourceByState(providerState),
    ruleVersion,
    isFallback: providerState !== "provider",
  };
}

function heroLeadFromBasis(basis: HomeNarrativeBasis) {
  if (basis.relationTone === "soft") return "오늘은 대화의 시작 톤이 흐름을 만듭니다.";
  if (basis.flowBias === "afternoon-peak") return "오늘은 핵심 타이밍을 오후에 두면 안정적입니다.";
  return "오늘은 말의 순서를 정리할수록 관계가 편안해집니다.";
}

function heroSupportFromBasis(basis: HomeNarrativeBasis) {
  if (basis.focusWindow === "morning-setup") return "오전 준비를 먼저 끝내면 하루 리듬이 부드러워져요.";
  if (basis.focusWindow === "evening-wrap") return "저녁 정리 루틴을 짧게 잡으면 피로를 줄일 수 있어요.";
  return "오후 집중 구간을 먼저 확보하면 흐름이 좋아요.";
}

function summaryLinePoolByTone(tone: HomeNarrativeBasis["relationTone"]) {
  if (tone === "soft") {
    return {
      line1: ["핵심 대화는 오늘 짧게 시작하세요.", "중요한 말은 첫 문장을 가볍게 여세요."],
      line2: ["속도보다 톤을 맞추면 흐름이 안정돼요.", "답을 급히 내지 않으면 반응이 좋아요."],
      line3: ["일정 우선순위만 잡아도 하루가 단단해져요.", "작은 정리 하나가 저녁 피로를 줄여줘요."],
    } as const;
  }

  return {
    line1: ["큰 결정보다 현재 조율이 먼저예요.", "핵심을 한 문장으로 먼저 제시해보세요."],
    line2: ["관계는 말의 길이보다 순서가 중요해요.", "즉답보다 확인 한 번이 안전해요."],
    line3: ["오후 집중 시간에 결론을 모으세요.", "중요 작업은 한 번에 하나씩 묶어 처리하세요."],
  } as const;
}

function buildSummary(seed: number, basis: HomeNarrativeBasis): [string, string, string] {
  const pool = summaryLinePoolByTone(basis.relationTone);
  const usedSummary = new Set<string>();

  const line1 = uniqueLine(pick(seed, pool.line1), usedSummary, pool.line1[0]);
  const line2 = uniqueLine(pick(seed + 3, pool.line2), usedSummary, pool.line2[0]);
  const line3 = uniqueLine(pick(seed + 7, pool.line3), usedSummary, pool.line3[0]);

  return [trimSentence(line1), trimSentence(line2), trimSentence(line3)];
}

function buildTodayPoints(seed: number, basis: HomeNarrativeBasis): HomeTodayPoints {
  const conversationPool = basis.relationTone === "soft"
    ? ["질문을 먼저 두면 대화가 부드러워져요.", "공감 한 문장을 먼저 건네보세요."]
    : ["핵심을 한 문장으로 먼저 꺼내세요.", "한 번에 한 메시지가 더 정확해요."];

  const wealthPool = basis.dominantElement === "earth"
    ? ["고정 지출만 점검해도 흐름이 안정돼요.", "오늘은 지출 기록 정리에 유리해요."]
    : ["작은 결제는 낮 시간에 묶어 처리하세요.", "결제 전 우선순위만 확인해도 좋아요."];

  const cautionPool = basis.supportElement === "water"
    ? ["감정 반응은 한 템포 늦추는 편이 좋아요.", "즉답보다 확인 한 번이 안전해요."]
    : ["약속 시간 겹침만 먼저 막아두세요.", "확정 전 체크리스트를 한 번 보세요."];

  return {
    conversation: trimSentence(pick(seed + 11, conversationPool), 34),
    wealth: trimSentence(pick(seed + 13, wealthPool), 34),
    caution: trimSentence(pick(seed + 17, cautionPool), 34),
  };
}

function buildTimeFlow(seed: number, basis: HomeNarrativeBasis): HomeTimeFlow {
  const morning = basis.focusWindow === "morning-setup"
    ? "루틴 정리와 일정 확인에 집중하세요."
    : "가벼운 작업부터 마감선을 세우세요.";

  const afternoon = basis.flowBias === "afternoon-peak"
    ? "핵심 업무와 결정은 오후에 배치하세요."
    : "중요 대화는 이 시간대가 가장 안정돼요.";

  const evening = basis.focusWindow === "evening-wrap"
    ? "관계 대화와 하루 정리에 맞는 시간이에요."
    : "결과를 짧게 기록하고 마무리하세요.";

  return {
    morning: trimSentence(seed % 2 === 0 ? morning : "오전엔 준비 속도를 올리는 게 좋아요."),
    afternoon: trimSentence(seed % 3 === 0 ? afternoon : "협업 조율은 오후에 결론이 잘 납니다."),
    evening: trimSentence(seed % 5 === 0 ? evening : "저녁엔 내일 준비를 가볍게 끝내세요."),
  };
}

export function buildMockHomeNarrative(input: UserProfileInput, providerState: ProviderState): HomeNarrativeSnapshot {
  const seed = seedFromProfile(input);
  const basis = buildHomeBasis(seed, providerState);
  const ruleVersion = HOME_RULE_VERSION;

  const heroLead = trimSentence(heroLeadFromBasis(basis));
  const heroSupport = trimSentence(heroSupportFromBasis(basis));
  const todaySummary = buildSummary(seed, basis);

  return {
    providerState,
    heroLead,
    heroSupport,
    todaySummary,
    todayPoints: buildTodayPoints(seed, basis),
    timeFlow: buildTimeFlow(seed, basis),
    confidence: confidenceByState(providerState),
    basisLabel: basisLabelByState(providerState),
    basisCodes: basis.basisCodes,
    ruleVersion,
    provenance: buildProvenance(providerState, ruleVersion),
    basis,
  };
}
