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
}

function seedFromProfile(input: UserProfileInput) {
  const today = new Date().toISOString().slice(0, 10);
  return `${input.birthDate}-${input.birthTime}-${input.gender}-${today}`
    .split("")
    .reduce((sum, ch) => sum + ch.charCodeAt(0), 0);
}

function pick<T>(seed: number, list: readonly T[]): T {
  return list[seed % list.length];
}

const heroLeadLines = [
  "오늘은 대화의 시작 톤이 흐름을 만듭니다.",
  "오늘은 작은 조율이 관계 리듬을 살립니다.",
  "오늘은 핵심을 짧게 말할수록 안정적입니다.",
] as const;

const heroSupportLines = [
  "첫 문장을 부드럽게 열면 반응이 편안해져요.",
  "속도보다 순서를 맞추면 갈등을 줄일 수 있어요.",
  "오후 집중 구간을 먼저 확보하면 흐름이 좋아요.",
] as const;

const summaryLine1 = [
  "핵심 대화는 오늘 짧게 시작하세요.",
  "중요한 말은 첫 문장을 가볍게 여세요.",
  "큰 결정보다 현재 조율이 먼저예요.",
] as const;

const summaryLine2 = [
  "속도보다 톤을 맞추면 흐름이 안정돼요.",
  "답을 급히 내지 않으면 반응이 좋아요.",
  "관계는 말의 길이보다 순서가 중요해요.",
] as const;

const summaryLine3 = [
  "오후에 집중이 올라오니 핵심을 배치하세요.",
  "작은 정리 하나가 저녁 피로를 줄여줘요.",
  "일정 우선순위만 잡아도 하루가 단단해져요.",
] as const;

const pointConversation = [
  "질문을 먼저 두면 대화가 부드러워져요.",
  "한 번에 한 메시지가 더 정확해요.",
  "핵심을 한 문장으로 먼저 꺼내세요.",
] as const;

const pointWealth = [
  "고정 지출만 점검해도 흐름이 안정돼요.",
  "작은 결제는 낮 시간에 묶어 처리하세요.",
  "오늘은 지출 기록 정리에 유리해요.",
] as const;

const pointCaution = [
  "즉답보다 확인 한 번이 안전해요.",
  "감정 반응은 한 템포 늦추는 편이 좋아요.",
  "약속 시간 겹침만 먼저 막아두세요.",
] as const;

const flowMorning = [
  "루틴 정리와 일정 확인에 집중하세요.",
  "가벼운 작업부터 마감선을 세우세요.",
  "오전엔 준비 속도를 올리는 게 좋아요.",
] as const;

const flowAfternoon = [
  "핵심 업무와 결정은 오후에 배치하세요.",
  "중요 대화는 이 시간대가 가장 안정돼요.",
  "협업 조율은 오후에 결론이 잘 납니다.",
] as const;

const flowEvening = [
  "관계 대화와 하루 정리에 맞는 시간이에요.",
  "결과를 짧게 기록하고 마무리하세요.",
  "저녁엔 내일 준비를 가볍게 끝내세요.",
] as const;

function trimSentence(value: string, cap = 31) {
  if (value.length <= cap) return value;
  const sliced = value.slice(0, cap).trim();
  return sliced.endsWith(".") ? sliced : `${sliced}.`;
}

function uniqueLine(value: string, used: Set<string>, fallback: string) {
  const normalized = value.replace(/\s+/g, " ").trim();
  if (!used.has(normalized)) {
    used.add(normalized);
    return normalized;
  }

  const alt = fallback.replace(/\s+/g, " ").trim();
  used.add(alt);
  return alt;
}

function buildRuleCodes(seed: number, providerState: ProviderState) {
  const toneCode = seed % 2 === 0 ? "RELATION_TONE_SOFT" : "RELATION_TONE_CLEAR";
  const flowCode = seed % 3 === 0 ? "FLOW_AFTERNOON_PEAK" : "FLOW_STEADY_DAY";

  if (providerState === "provider") {
    return ["CHART_SIGNAL", "DAILY_FLOW", toneCode, flowCode];
  }

  if (providerState === "mock-fallback") {
    return ["PROVIDER_PARTIAL_DATA", "MOCK_NARRATIVE_FALLBACK", toneCode, flowCode];
  }

  return ["MOCK_NARRATIVE_V1", toneCode, flowCode];
}

export function buildMockHomeNarrative(input: UserProfileInput, providerState: ProviderState): HomeNarrativeSnapshot {
  const seed = seedFromProfile(input);
  const confidence: NarrativeConfidence = providerState === "provider" ? "high" : providerState === "mock-fallback" ? "medium" : "low";

  const usedSummary = new Set<string>();
  const heroLead = trimSentence(pick(seed + 2, heroLeadLines));
  const heroSupport = trimSentence(pick(seed + 5, heroSupportLines));
  const line1 = uniqueLine(pick(seed, summaryLine1), usedSummary, summaryLine1[0]);
  const line2 = uniqueLine(pick(seed + 3, summaryLine2), usedSummary, summaryLine2[1]);
  const line3 = uniqueLine(pick(seed + 7, summaryLine3), usedSummary, summaryLine3[2]);

  return {
    providerState,
    heroLead,
    heroSupport,
    todaySummary: [trimSentence(line1), trimSentence(line2), trimSentence(line3)],
    todayPoints: {
      conversation: trimSentence(pick(seed + 11, pointConversation)),
      wealth: trimSentence(pick(seed + 13, pointWealth)),
      caution: trimSentence(pick(seed + 17, pointCaution)),
    },
    timeFlow: {
      morning: trimSentence(pick(seed + 19, flowMorning)),
      afternoon: trimSentence(pick(seed + 23, flowAfternoon)),
      evening: trimSentence(pick(seed + 29, flowEvening)),
    },
    confidence,
    basisLabel: providerState === "provider" ? "실시간 사주 해석" : providerState === "mock-fallback" ? "부분 fallback 해석" : "기본 mock 해석",
    basisCodes: buildRuleCodes(seed, providerState),
  };
}
