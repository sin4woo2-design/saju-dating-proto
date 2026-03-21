import type { ProviderState, SajuResult } from "./types";
import type { SajuAnalysis, UserProfileInput } from "../../types/saju";
import { elementLabel, getAnalysisBasisPhrase, getAnalysisSubjectPhrase, getStrengthLabel } from "../sajuAnalysis";
import { pickWithRecencyGuard } from "./variationMemory";

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

const HOME_RULE_VERSION = "home-v3";

interface HomeBasisContext {
  saju?: SajuResult;
}

function getRotationNonce(input: UserProfileInput) {
  if (typeof window === "undefined") return 0;

  const today = new Date().toISOString().slice(0, 10);
  const key = `home-narrative-rotation:${input.birthDate}:${input.birthTime}:${input.gender}:${today}`;

  const current = Number(window.localStorage.getItem(key) || "0");
  const next = (current + 1) % 13;
  window.localStorage.setItem(key, String(next));
  return next;
}

function seedFromProfile(input: UserProfileInput) {
  const now = new Date();
  const today = now.toISOString().slice(0, 10);
  const hourBucket = Math.floor(now.getUTCHours() / 3); // 0~7
  return `${input.birthDate}-${input.birthTime}-${input.gender}-${today}-h${hourBucket}`
    .split("")
    .reduce((sum, ch) => sum + ch.charCodeAt(0), 0);
}

function pick<T>(seed: number, list: readonly T[]): T {
  return list[seed % list.length];
}

function trimSentence(value: string, cap = 84) {
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

function sortedElementsByScore(saju?: SajuResult) {
  const fe = saju?.profile?.fiveElements;
  if (!fe) return [] as Array<{ key: HomeNarrativeBasis["dominantElement"]; value: number }>;

  return (Object.entries(fe) as Array<[HomeNarrativeBasis["dominantElement"], number]>)
    .sort((a, b) => b[1] - a[1])
    .map(([key, value]) => ({ key, value }));
}

function hasSignal(saju: SajuResult | undefined, token: string) {
  return (saju?.chart?.signals ?? []).some((signal) => signal.includes(token));
}

function buildHomeBasis(seed: number, providerState: ProviderState, context?: HomeBasisContext): HomeNarrativeBasis {
  const ranked = sortedElementsByScore(context?.saju);
  const analysis = context?.saju?.profile.analysis;
  const dominantElement = analysis?.dominantElement ?? ranked[0]?.key ?? elementBySeed(seed + 1);
  const supportElement = analysis?.usefulElements[0] ?? ranked[1]?.key ?? elementBySeed(seed + 3);

  const flowBias: HomeNarrativeBasis["flowBias"] = hasSignal(context?.saju, "AFTERNOON") || hasSignal(context?.saju, "FLOW_PEAK")
    ? "afternoon-peak"
    : analysis?.strengthLevel === "strong" || analysis?.dominantElement === "fire"
      ? "afternoon-peak"
      : "steady-day";

  const relationTone: HomeNarrativeBasis["relationTone"] = hasSignal(context?.saju, "RELATION_TONE_SOFT") || hasSignal(context?.saju, "COMM_SOFT")
    ? "soft"
    : hasSignal(context?.saju, "RELATION_TONE_CLEAR") || hasSignal(context?.saju, "COMM_CLEAR")
      ? "clear"
      : analysis?.strengthLevel === "weak" || analysis?.dayMasterElement === "water"
        ? "soft"
        : analysis?.strengthLevel === "strong" || analysis?.dayMasterElement === "metal"
          ? "clear"
      : seed % 2 === 0
        ? "soft"
        : "clear";

  const focusWindow: HomeNarrativeBasis["focusWindow"] = hasSignal(context?.saju, "MORNING")
    ? "morning-setup"
    : hasSignal(context?.saju, "EVENING")
      ? "evening-wrap"
      : flowBias === "afternoon-peak"
        ? "afternoon-focus"
        : analysis?.usefulElements.includes("wood")
          ? "morning-setup"
          : analysis?.usefulElements.includes("water")
            ? "evening-wrap"
        : seed % 5 === 0
          ? "morning-setup"
          : seed % 5 <= 2
            ? "afternoon-focus"
            : "evening-wrap";

  return {
    dominantElement,
    supportElement,
    flowBias,
    relationTone,
    focusWindow,
    basisCodes: buildBasisCodes(providerState, relationTone, flowBias),
  };
}

function buildProvenance(providerState: ProviderState, ruleVersion: string, context?: HomeBasisContext): NarrativeProvenance {
  return {
    providerState,
    chartSource: context?.saju?.chart?.calculationSource || chartSourceByState(providerState),
    ruleVersion: context?.saju?.chart?.ruleVersion || ruleVersion,
    isFallback: providerState !== "provider",
  };
}

function buildAnalysisHeroLead(analysis: SajuAnalysis, basis: HomeNarrativeBasis) {
  if (basis.relationTone === "soft") {
    return `${getAnalysisSubjectPhrase(analysis)} 오늘 대화의 온도를 먼저 맞출수록 흐름이 부드러워져요.`;
  }
  if (basis.flowBias === "afternoon-peak") {
    return `${getAnalysisSubjectPhrase(analysis)} 오늘 핵심 결정과 중요한 대화를 오후 블록에 둘수록 안정적이에요.`;
  }
  return `${getAnalysisSubjectPhrase(analysis)} 오늘 말의 순서와 일정 리듬을 정리할수록 관계 피로가 줄어들어요.`;
}

function buildAnalysisHeroSupport(analysis: SajuAnalysis, basis: HomeNarrativeBasis) {
  const usefulLabel = analysis.usefulElements.map((element) => elementLabel(element)).join("·");
  const weakestLabel = elementLabel(analysis.weakestElement);

  if (basis.focusWindow === "morning-setup") {
    return `${usefulLabel} 기운을 닮은 방식으로 오전에 우선순위만 먼저 잡아도 하루 리듬이 훨씬 편해져요.`;
  }
  if (basis.focusWindow === "evening-wrap") {
    return `${weakestLabel} 축이 무너지지 않게 저녁에는 정리와 회복 루틴을 짧게 넣어 두세요.`;
  }
  return `${getStrengthLabel(analysis.strengthLevel)} 흐름이라 오후 집중 구간에 핵심 안건을 모을수록 체감 효율이 좋아져요.`;
}

function buildAnalysisSummary(analysis: SajuAnalysis, basis: HomeNarrativeBasis): [string, string, string] {
  if (analysis.basisOrigin === "provider" && analysis.summaryLines.length >= 3) {
    const [line1, line2, line3] = analysis.summaryLines;
    return [trimSentence(line1), trimSentence(line2), trimSentence(line3)];
  }

  const usefulLabel = analysis.usefulElements.map((element) => elementLabel(element)).join("·");
  const cautionLabel = analysis.cautionElements.map((element) => elementLabel(element)).join("·");
  const weakestLabel = elementLabel(analysis.weakestElement);

  return [
    trimSentence(`${getAnalysisBasisPhrase(analysis)} 오늘 ${usefulLabel} 기운을 닮은 태도, 즉 ${basis.relationTone === "soft" ? "부드러운 시작과 확인 질문" : "분명한 우선순위와 간결한 제안"}에서 힘이 실려요.`),
    trimSentence(`${getStrengthLabel(analysis.strengthLevel)} 흐름이라 ${basis.focusWindow === "afternoon-focus" ? "오후 핵심 블록에 힘을 모을수록" : basis.focusWindow === "morning-setup" ? "오전 준비를 먼저 끝낼수록" : "저녁 전에 정리 루틴을 잡을수록"} 체감 안정감이 커져요.`),
    trimSentence(`${cautionLabel} 기운이 과해지면 흐름이 거칠어질 수 있으니, ${weakestLabel} 축을 보완하는 휴식과 정리 루틴을 먼저 챙겨 주세요.`),
  ];
}

function buildAnalysisPoints(analysis: SajuAnalysis, basis: HomeNarrativeBasis): HomeTodayPoints {
  const usefulLabel = analysis.usefulElements.map((element) => elementLabel(element)).join("·");
  const cautionLabel = analysis.cautionElements.map((element) => elementLabel(element)).join("·");
  const weakestLabel = elementLabel(analysis.weakestElement);

  return {
    conversation: trimSentence(
      basis.relationTone === "soft"
        ? `${usefulLabel} 기운처럼 질문을 먼저 두고 감정 확인 한 문장을 섞으면 대화가 훨씬 매끄러워져요.`
        : `${usefulLabel} 기운처럼 핵심을 짧게 정리한 뒤 근거를 붙이면 설득력이 크게 올라가요.`,
    ),
    wealth: trimSentence(
      analysis.strengthLevel === "strong"
        ? `지출과 일정 모두 한 번에 넓게 벌리기보다 우선순위를 좁혀 정리하는 편이 유리해요.`
        : `생활 리듬을 안정시키는 소비와 반복 지출 정리에 집중하면 오늘 흐름이 편안해져요.`,
    ),
    caution: trimSentence(`${cautionLabel} 기운이 과하면 판단이 급해지거나 반응이 흔들릴 수 있어요. 특히 ${weakestLabel} 축이 무너지지 않게 휴식 간격을 먼저 확보해 주세요.`),
  };
}

function buildAnalysisTimeFlow(analysis: SajuAnalysis, basis: HomeNarrativeBasis): HomeTimeFlow {
  const usefulLabel = analysis.usefulElements.map((element) => elementLabel(element)).join("·");
  const weakestLabel = elementLabel(analysis.weakestElement);

  return {
    morning: trimSentence(
      basis.focusWindow === "morning-setup"
        ? `${usefulLabel} 기운을 닮은 방식으로 오전엔 우선순위와 일정부터 정리하세요.`
        : `오전엔 작은 할 일부터 가볍게 끝내며 리듬을 세팅하는 편이 좋아요.`,
    ),
    afternoon: trimSentence(
      basis.flowBias === "afternoon-peak"
        ? `${getAnalysisSubjectPhrase(analysis)} 오후에 결정력과 추진력이 붙기 쉬워 핵심 대화와 중요한 작업을 이때 모으는 편이 좋아요.`
        : `오후엔 피드백, 조율, 점검처럼 흐름을 다듬는 작업이 더 잘 맞아요.`,
    ),
    evening: trimSentence(
      basis.focusWindow === "evening-wrap"
        ? `${weakestLabel} 축 회복을 위해 저녁엔 감정 정리와 회복 루틴을 짧게 넣어 주세요.`
        : `저녁엔 내일 준비를 가볍게 끝내며 관계 온도를 정리하는 편이 안정적이에요.`,
    ),
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
      line1: [
        "핵심 대화는 오늘 짧게 시작하세요.",
        "중요한 말은 첫 문장을 가볍게 여세요.",
        "감정 온도를 먼저 맞추면 대화가 훨씬 부드러워져요.",
        "질문형 첫 문장이 오늘 흐름을 부드럽게 열어요.",
        "부드러운 어조가 오늘 관계 운을 안정시켜요.",
      ],
      line2: [
        "속도보다 톤을 맞추면 흐름이 안정돼요.",
        "답을 급히 내지 않으면 반응이 좋아요.",
        "공감 한 문장을 먼저 두면 오해가 줄어요.",
        "한 박자 쉬고 답하면 대화 품질이 올라가요.",
        "말의 길이보다 분위기 조율이 더 중요해요.",
      ],
      line3: [
        "일정 우선순위만 잡아도 하루가 단단해져요.",
        "작은 정리 하나가 저녁 피로를 줄여줘요.",
        "가벼운 루틴 체크가 오늘 흐름을 안정시켜요.",
        "오후 전 할 일 3개만 고르면 집중이 쉬워져요.",
        "저녁 전에 마무리 체크를 하면 피로가 줄어요.",
      ],
    } as const;
  }

  return {
    line1: [
      "큰 결정보다 현재 조율이 먼저예요.",
      "핵심을 한 문장으로 먼저 제시해보세요.",
      "오늘은 기준을 선명히 두면 실행 속도가 올라가요.",
      "결론보다 우선순위부터 맞추면 마찰이 줄어요.",
      "핵심 안건을 먼저 고정하면 하루가 정리돼요.",
    ],
    line2: [
      "관계는 말의 길이보다 순서가 중요해요.",
      "즉답보다 확인 한 번이 안전해요.",
      "요청-근거 순서로 말하면 설득력이 높아져요.",
      "체크 질문 하나가 오해를 크게 줄여줘요.",
      "대화의 결론 조건을 먼저 맞추면 효율적이에요.",
    ],
    line3: [
      "오후 집중 시간에 결론을 모으세요.",
      "중요 작업은 한 번에 하나씩 묶어 처리하세요.",
      "핵심 작업을 블록으로 묶으면 효율이 좋아져요.",
      "중요 결정을 오후 블록에 몰면 품질이 좋아요.",
      "작업 전환 횟수를 줄이면 성과가 올라가요.",
    ],
  } as const;
}

function buildSummary(seed: number, basis: HomeNarrativeBasis, confidence: NarrativeConfidence, rotation: number): [string, string, string] {
  const pool = summaryLinePoolByTone(basis.relationTone);
  const usedSummary = new Set<string>();

  const dominantLineMap: Record<HomeNarrativeBasis["dominantElement"], string[]> = {
    wood: ["새 시도는 작은 단위로 시작할수록 성과가 좋아요.", "학습/성장형 과제가 오늘 잘 맞아요.", "확장형 아이디어를 실행으로 옮기기 좋은 날이에요.", "목 기운이 강해 기획-실행 연결이 매끄러워요."],
    fire: ["표현력이 올라가는 날이라 발표/대화에 강점이 있어요.", "첫인상 임팩트가 좋은 날이에요.", "화 기운 덕분에 반응 속도가 빠르고 선명해요.", "감정 전달력이 좋아 관계 온도를 올리기 유리해요."],
    earth: ["안정 루틴을 고정하면 하루 전체가 편해져요.", "정리/관리형 작업의 완성도가 높아요.", "토 기운이 받쳐줘 실무 정리력이 돋보여요.", "지속 가능한 페이스를 만들기 좋은 흐름이에요."],
    metal: ["우선순위 재정렬이 성과를 크게 올려줘요.", "기준을 정하면 실행 속도가 빨라져요.", "금 기운 영향으로 기준/원칙 정리가 강해져요.", "결정 프레임을 세우면 하루가 빠르게 정돈돼요."],
    water: ["관찰과 공감이 필요한 작업에서 강점이 살아나요.", "깊이 있는 대화가 성과로 연결되기 좋아요.", "수 기운이 강해 맥락 읽기와 해석이 좋아져요.", "정서 흐름을 읽는 능력이 오늘 특히 선명해요."],
  };

  const bucket = `${basis.relationTone}:${basis.flowBias}:${basis.focusWindow}:${basis.dominantElement}:${basis.supportElement}:${confidence}`;
  const nuancePool = {
    intro: ["템포를 낮추면 기회가 보여요.", "한 문장 정리가 오늘의 성과를 만듭니다.", "우선순위를 짧게 고정하면 흐름이 살아나요."],
    bridge: ["대화의 온도 조절이 핵심이에요.", "질문형 접근이 반응을 좋게 만들어요.", "결론 전에 확인 한 번이 안전해요."],
    close: ["저녁 전에 정리하면 피로가 줄어요.", "작은 마감이 큰 안정감으로 이어져요.", "하루 끝 체크가 내일 리듬을 살려줘요."],
  } as const;

  const line1Base = pickWithRecencyGuard(pool.line1, seed + 1, (v) => String(v), "home-summary-line1", bucket);
  const line1 = uniqueLine(
    `${line1Base} ${pickWithRecencyGuard(nuancePool.intro, seed + 2 + rotation, (v) => String(v), "home-summary-intro", bucket)}`,
    usedSummary,
    pool.line1[0],
  );

  const line2Base = pickWithRecencyGuard(dominantLineMap[basis.dominantElement], seed + 3, (v) => String(v), "home-summary-line2", bucket);
  const line2 = uniqueLine(
    `${line2Base} ${pickWithRecencyGuard(nuancePool.bridge, seed + 4 + rotation, (v) => String(v), "home-summary-bridge", bucket)}`,
    usedSummary,
    pool.line2[0],
  );

  const line3Candidates = basis.flowBias === "afternoon-peak" ? [pool.line3[0], ...(pool.line3[1] ? [pool.line3[1]] : [])] : [pool.line3[1] ?? pool.line3[0], pool.line3[0]];
  const line3Base = pickWithRecencyGuard(line3Candidates, seed + 5, (v) => String(v), "home-summary-line3", bucket);
  const line3 = uniqueLine(
    `${line3Base} ${pickWithRecencyGuard(nuancePool.close, seed + 6 + rotation, (v) => String(v), "home-summary-close", bucket)}`,
    usedSummary,
    pool.line3[0],
  );

  return [trimSentence(line1), trimSentence(line2), trimSentence(line3)];
}

function buildTodayPoints(seed: number, basis: HomeNarrativeBasis, confidence: NarrativeConfidence, rotation: number): HomeTodayPoints {
  const conversationPool = basis.relationTone === "soft"
    ? [
        "질문을 먼저 두면 대화가 부드러워져요.",
        "공감 한 문장을 먼저 두면 반응이 열려요.",
        "결론보다 맥락을 먼저 확인하면 갈등이 줄어요.",
      ]
    : [
        "핵심을 한 문장으로 먼저 꺼내세요.",
        "요청-근거-기한 순서로 말하면 오해가 줄어요.",
        "결정 포인트를 먼저 합의하면 대화가 빨라져요.",
      ];

  const wealthPool: Record<HomeNarrativeBasis["dominantElement"], string[]> = {
    wood: ["학습/도구 지출은 효율부터 비교해보세요.", "확장성 있는 지출만 남기면 흐름이 좋아져요."],
    fire: ["충동 결제는 오후 이후 한 번 더 확인하세요.", "작은 소비는 예산 한도를 먼저 정해두세요."],
    earth: ["고정 지출만 점검해도 흐름이 안정돼요.", "생활비 카테고리 재정렬만 해도 누수가 줄어요."],
    metal: ["정기결제 정리로 이번 주 현금흐름이 개선돼요.", "우선순위 낮은 결제는 오늘 정리해두세요."],
    water: ["정보성 소비는 메모 후 하루 뒤 결제하세요.", "감정성 지출은 시간 간격을 두면 정확해져요."],
  };

  const cautionPool = basis.supportElement === "water"
    ? [
        "감정 반응은 한 템포 늦추는 편이 좋아요.",
        "늦은 시간 감정 대화는 길어지기 쉬워요.",
      ]
    : [
        "약속 시간 겹침만 먼저 막아두세요.",
        "일정 충돌을 먼저 지우면 스트레스가 줄어요.",
      ];

  const bucket = `${basis.relationTone}:${basis.supportElement}:${basis.dominantElement}:${confidence}`;
  return {
    conversation: trimSentence(pickWithRecencyGuard(conversationPool, seed + 7 + rotation, (v) => String(v), "home-point-conversation", bucket), 84),
    wealth: trimSentence(pickWithRecencyGuard(wealthPool[basis.dominantElement], seed + 11 + rotation, (v) => String(v), "home-point-wealth", bucket), 84),
    caution: trimSentence(pickWithRecencyGuard(cautionPool, seed + 13 + rotation, (v) => String(v), "home-point-caution", bucket), 84),
  };
}

function buildTimeFlow(seed: number, basis: HomeNarrativeBasis, confidence: NarrativeConfidence, rotation: number): HomeTimeFlow {
  const morningPool = basis.focusWindow === "morning-setup"
    ? ["루틴 정리와 일정 확인에 집중하세요.", "오전은 계획 확정/우선순위 정리에 최적이에요."]
    : ["오전엔 준비 속도를 올리는 게 좋아요.", "작은 할 일을 먼저 끝내면 오후가 가벼워져요."];

  const afternoonPool = basis.flowBias === "afternoon-peak"
    ? ["핵심 업무와 결정은 오후에 배치하세요.", "중요한 미팅은 오후 블록에 넣는 게 좋아요."]
    : ["중요 대화는 이 시간대가 가장 안정돼요.", "리뷰/피드백 성격 작업에 적합한 흐름이에요."];

  const eveningPool = basis.focusWindow === "evening-wrap"
    ? ["관계 대화와 하루 정리에 맞는 시간이에요.", "감정 정리/회복 루틴을 짧게 넣어보세요."]
    : ["저녁엔 내일 준비를 가볍게 끝내세요.", "마무리 체크리스트 3개만 정리하면 좋아요."];

  const confidenceTail = confidence === "high"
    ? ["근거 신호가 충분해 실행 우선순위에 바로 적용해도 좋아요."]
    : confidence === "medium"
      ? ["핵심 흐름은 유효하지만 중요한 결정은 한 번 더 확인하세요."]
      : ["보정 구간이라 큰 결정은 보수적으로 접근하세요."];

  return {
    morning: trimSentence(`${pick(seed + 17, morningPool)} ${pick(seed + 18 + rotation, confidenceTail)}`),
    afternoon: trimSentence(`${pick(seed + 19, afternoonPool)} ${pick(seed + 20 + rotation, confidenceTail)}`),
    evening: trimSentence(`${pick(seed + 23, eveningPool)} ${pick(seed + 24 + rotation, confidenceTail)}`),
  };
}

export function buildMockHomeNarrative(input: UserProfileInput, providerState: ProviderState, context?: HomeBasisContext): HomeNarrativeSnapshot {
  const seed = seedFromProfile(input);
  const basis = buildHomeBasis(seed, providerState, context);
  const provenance = buildProvenance(providerState, HOME_RULE_VERSION, context);
  const ruleVersion = provenance.ruleVersion || HOME_RULE_VERSION;

  const confidence = confidenceByState(providerState);
  const rotation = getRotationNonce(input);
  const analysis = context?.saju?.profile.analysis;
  const heroLead = trimSentence(analysis ? buildAnalysisHeroLead(analysis, basis) : heroLeadFromBasis(basis));
  const heroSupport = trimSentence(analysis ? buildAnalysisHeroSupport(analysis, basis) : heroSupportFromBasis(basis));
  const todaySummary = analysis ? buildAnalysisSummary(analysis, basis) : buildSummary(seed, basis, confidence, rotation);

  return {
    providerState,
    heroLead,
    heroSupport,
    todaySummary,
    todayPoints: analysis ? buildAnalysisPoints(analysis, basis) : buildTodayPoints(seed, basis, confidence, rotation),
    timeFlow: analysis ? buildAnalysisTimeFlow(analysis, basis) : buildTimeFlow(seed, basis, confidence, rotation),
    confidence,
    basisLabel: basisLabelByState(providerState),
    basisCodes: basis.basisCodes,
    ruleVersion,
    provenance,
    basis,
  };
}
