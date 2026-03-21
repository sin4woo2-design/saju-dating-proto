import type { ElementKey, SajuProfile, UserProfileInput } from "../types/saju";
import { buildProfileFromFiveElements, getFiveElementsBalance } from "./engine/mockEngine";
import { elementLabel, getAnalysisBasisPhrase } from "./sajuAnalysis";

export interface DailyFortuneScores {
  total: number;
  love: number;
  work: number;
  health: number;
}

export interface DailyFortuneSnapshot {
  dateKey: string;
  themeElement: ElementKey;
  scores: DailyFortuneScores;
  heroLead: string;
  heroSupport: string;
  loveMessage: string;
  workMessage: string;
  healthMessage: string;
  actionItems: string[];
  cautionLine: string;
}

const ELEMENT_ORDER: ElementKey[] = ["wood", "fire", "earth", "metal", "water"];

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function dateKeyOf(date: Date) {
  return date.toISOString().slice(0, 10);
}

function buildInputSeed(me: UserProfileInput, date: Date) {
  return `${me.birthDate}-${me.birthTime}-${me.gender}-${dateKeyOf(date)}`
    .split("")
    .reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
}

function buildDateSeed(date: Date) {
  return dateKeyOf(date)
    .split("")
    .reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
}

function themeElementForDate(date: Date): ElementKey {
  return ELEMENT_ORDER[buildDateSeed(date) % ELEMENT_ORDER.length];
}

function relationBonus(profile: SajuProfile, themeElement: ElementKey) {
  const analysis = profile.analysis;
  if (!analysis) return 0;
  if (analysis.usefulElements.includes(themeElement)) return 9;
  if (analysis.supportElements.includes(themeElement)) return 5;
  if (analysis.cautionElements.includes(themeElement)) return -7;
  return 1;
}

function scoreFromProfile(profile: SajuProfile, date: Date): DailyFortuneScores {
  const analysis = profile.analysis;
  const themeElement = themeElementForDate(date);
  const seed = buildDateSeed(date);
  const dayShift = (seed % 9) - 4;
  const themeBonus = relationBonus(profile, themeElement);
  const balanceBonus = analysis?.strengthLevel === "balanced" ? 4 : analysis?.strengthLevel === "weak" ? 1 : -1;
  const total = clamp(70 + themeBonus + balanceBonus + dayShift, 52, 96);

  const loveAffinity = analysis?.usefulElements.includes("water") || analysis?.usefulElements.includes("wood") ? 4 : -1;
  const workAffinity = analysis?.usefulElements.includes("metal") || analysis?.usefulElements.includes("earth") ? 5 : 0;
  const healthAffinity = analysis?.weakestElement === "water" || analysis?.weakestElement === "wood" ? -2 : 2;

  return {
    total,
    love: clamp(total + loveAffinity + ((seed * 3) % 7) - 3, 48, 98),
    work: clamp(total + workAffinity + ((seed * 5) % 9) - 4, 48, 98),
    health: clamp(total + healthAffinity + ((seed * 7) % 7) - 3, 46, 97),
  };
}

function buildHeroLead(profile: SajuProfile, themeElement: ElementKey, scores: DailyFortuneScores) {
  const analysis = profile.analysis;
  if (!analysis) return `오늘은 ${elementLabel(themeElement)} 기운이 전체 흐름을 이끌어요.`;
  if (analysis.basisOrigin === "provider" && analysis.summaryLines[0] && scores.total >= 74) {
    return analysis.summaryLines[0];
  }
  if (analysis.usefulElements.includes(themeElement)) {
    return `오늘은 ${elementLabel(themeElement)} 기운이 들어와 ${getAnalysisBasisPhrase(analysis)} 리듬을 부드럽게 밀어줍니다.`;
  }
  if (analysis.cautionElements.includes(themeElement)) {
    return `오늘은 ${elementLabel(themeElement)} 기운이 강하게 들어와 속도 조절이 중요한 날입니다.`;
  }
  if (scores.total >= 82) {
    return `${getAnalysisBasisPhrase(analysis)} 오늘은 흐름이 비교적 잘 맞는 편이에요.`;
  }
  return `${getAnalysisBasisPhrase(analysis)} 오늘은 기본기를 챙길수록 운이 살아납니다.`;
}

function buildHeroSupport(profile: SajuProfile, themeElement: ElementKey) {
  const analysis = profile.analysis;
  if (!analysis) return "중요한 결정은 한 번 더 정리한 뒤 움직여 보세요.";
  if (analysis.basisOrigin === "provider" && analysis.summaryLines[1]) {
    return analysis.summaryLines[1];
  }
  const usefulLabel = analysis.usefulElements.map((element) => elementLabel(element)).join("·");
  if (analysis.usefulElements.includes(themeElement)) {
    return `${usefulLabel} 기운을 쓰는 방식으로 말과 일의 순서를 정리하면 체감이 훨씬 좋아집니다.`;
  }
  return `${elementLabel(analysis.weakestElement)} 축이 무너지지 않도록 휴식, 속도, 감정선을 먼저 챙겨보세요.`;
}

function buildCategoryMessage(profile: SajuProfile, scores: DailyFortuneScores) {
  const analysis = profile.analysis;
  const usefulLabel = analysis?.usefulElements.map((element) => elementLabel(element)).join("·") ?? "균형";
  const weakLabel = analysis ? elementLabel(analysis.weakestElement) : "균형";

  return {
    loveMessage:
      scores.love >= 80
        ? `대화 톤을 맞추면 호감 흐름이 빨리 붙습니다. ${usefulLabel} 기운처럼 부드럽게 여지를 남기는 말이 잘 먹혀요.`
        : `관계 속도를 앞당기기보다 신뢰를 쌓는 편이 좋습니다. 약한 ${weakLabel} 축이 흔들리지 않게 감정 과열을 피하세요.`,
    workMessage:
      scores.work >= 80
        ? `우선순위와 마감 순서를 먼저 고정하면 성과 체감이 큽니다. 중요한 일은 한 번에 하나씩 묶어 보세요.`
        : `오늘은 확장보다 정리가 더 중요합니다. 작은 누락을 줄이는 쪽이 전체 흐름을 살립니다.`,
    healthMessage:
      scores.health >= 78
        ? `컨디션 회복력이 괜찮은 편이지만, 리듬이 무너지기 전에 쉬는 타이밍을 먼저 잡는 게 좋습니다.`
        : `피로가 쌓이기 쉬운 날이라 수면, 수분, 식사 간격을 먼저 챙기는 편이 좋습니다.`,
  };
}

function buildActionItems(profile: SajuProfile, themeElement: ElementKey): string[] {
  const analysis = profile.analysis;
  const usefulLabel = analysis?.usefulElements.map((element) => elementLabel(element)).join("·") ?? "균형";
  const weakLabel = analysis ? elementLabel(analysis.weakestElement) : "리듬";

  return [
    `${elementLabel(themeElement)} 테마가 강한 날이니 아침에 오늘 할 일 3개만 먼저 고정하기`,
    `${usefulLabel} 기운을 쓰는 방식으로 중요한 대화는 짧고 분명하게 시작하기`,
    `${weakLabel} 축이 흔들리지 않게 저녁 전 휴식과 마감 루틴 잡기`,
  ];
}

function buildCautionLine(profile: SajuProfile, themeElement: ElementKey) {
  const analysis = profile.analysis;
  if (!analysis) return "감정 반응보다 일정과 회복 루틴을 먼저 챙겨보세요.";
  if (analysis.basisOrigin === "provider" && analysis.summaryLines[2]) {
    return analysis.summaryLines[2];
  }
  if (analysis.cautionElements.includes(themeElement)) {
    return `${elementLabel(themeElement)} 기운이 과해지면 판단이 급해질 수 있어요. 답을 내리기 전 한 템포 늦추는 편이 좋습니다.`;
  }
  return `${elementLabel(analysis.weakestElement)} 축이 약한 명식이라 무리해서 끌고 가기보다 템포를 조절하는 쪽이 안정적입니다.`;
}

export function buildDailyFortuneSnapshotFromProfile(profile: SajuProfile, date = new Date()): DailyFortuneSnapshot {
  const themeElement = themeElementForDate(date);
  const scores = scoreFromProfile(profile, date);
  const messages = buildCategoryMessage(profile, scores);

  return {
    dateKey: dateKeyOf(date),
    themeElement,
    scores,
    heroLead: buildHeroLead(profile, themeElement, scores),
    heroSupport: buildHeroSupport(profile, themeElement),
    loveMessage: messages.loveMessage,
    workMessage: messages.workMessage,
    healthMessage: messages.healthMessage,
    actionItems: buildActionItems(profile, themeElement),
    cautionLine: buildCautionLine(profile, themeElement),
  };
}

export function calculateDailyFortuneSnapshot(input: UserProfileInput, date = new Date()): DailyFortuneSnapshot {
  const seed = buildInputSeed(input, date);
  const profile = buildProfileFromFiveElements(getFiveElementsBalance(seed));
  return buildDailyFortuneSnapshotFromProfile(profile, date);
}

export function calculateDailyFortuneScores(me: UserProfileInput): DailyFortuneScores {
  return calculateDailyFortuneSnapshot(me).scores;
}
