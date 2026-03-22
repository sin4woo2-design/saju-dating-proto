import type {
  ElementKey,
  FiveElementsBalance,
  SajuAnalysis,
  SajuElementBreakdown,
  SajuPillarsSnapshot,
  SajuProfile,
  SajuSeason,
  SajuStrengthLevel,
  SajuTenGodCode,
  SajuTenGodInsight,
  YinYang,
} from "../types/saju";
import type { ProviderElementBreakdownV2, ProviderSajuBasisV2 } from "./engine/provider-contract";

type PillarKey = "year" | "month" | "day" | "hour";

interface StemMeta {
  element: ElementKey;
  yinYang: YinYang;
  label: string;
}

interface BranchMeta {
  element: ElementKey;
  season: SajuSeason;
  label: string;
}

const ELEMENT_LABELS: Record<ElementKey, string> = {
  wood: "목",
  fire: "화",
  earth: "토",
  metal: "금",
  water: "수",
};

const STEM_META: Record<string, StemMeta> = {
  甲: { element: "wood", yinYang: "yang", label: "갑목" },
  乙: { element: "wood", yinYang: "yin", label: "을목" },
  丙: { element: "fire", yinYang: "yang", label: "병화" },
  丁: { element: "fire", yinYang: "yin", label: "정화" },
  戊: { element: "earth", yinYang: "yang", label: "무토" },
  己: { element: "earth", yinYang: "yin", label: "기토" },
  庚: { element: "metal", yinYang: "yang", label: "경금" },
  辛: { element: "metal", yinYang: "yin", label: "신금" },
  壬: { element: "water", yinYang: "yang", label: "임수" },
  癸: { element: "water", yinYang: "yin", label: "계수" },
};

const BRANCH_META: Record<string, BranchMeta> = {
  寅: { element: "wood", season: "spring", label: "인목" },
  卯: { element: "wood", season: "spring", label: "묘목" },
  巳: { element: "fire", season: "summer", label: "사화" },
  午: { element: "fire", season: "summer", label: "오화" },
  辰: { element: "earth", season: "transition", label: "진토" },
  戌: { element: "earth", season: "transition", label: "술토" },
  丑: { element: "earth", season: "transition", label: "축토" },
  未: { element: "earth", season: "transition", label: "미토" },
  申: { element: "metal", season: "autumn", label: "신금" },
  酉: { element: "metal", season: "autumn", label: "유금" },
  亥: { element: "water", season: "winter", label: "해수" },
  子: { element: "water", season: "winter", label: "자수" },
};

const GENERATES: Record<ElementKey, ElementKey> = {
  wood: "fire",
  fire: "earth",
  earth: "metal",
  metal: "water",
  water: "wood",
};

const CONTROLS: Record<ElementKey, ElementKey> = {
  wood: "earth",
  fire: "metal",
  earth: "water",
  metal: "wood",
  water: "fire",
};

const TEN_GOD_LABELS: Record<SajuTenGodCode, string> = {
  peer: "비견",
  rival: "겁재",
  food: "식신",
  hurting: "상관",
  indirectWealth: "편재",
  directWealth: "정재",
  sevenKillings: "편관",
  directOfficer: "정관",
  indirectResource: "편인",
  directResource: "정인",
};

const ELEMENT_REACTION_HINTS: Record<ElementKey, string> = {
  wood: "시작 의지와 성장성",
  fire: "표정과 분위기",
  earth: "안정감과 꾸준함",
  metal: "정리된 말과 분명한 기준",
  water: "감정의 결과 속도",
};

const ELEMENT_APPROACH_HINTS: Record<ElementKey, string> = {
  wood: "작게라도 시작점을 만들고 방향을 세우는",
  fire: "표정과 반응을 열어 두는",
  earth: "리듬을 고정하고 안정감을 챙기는",
  metal: "핵심을 정리하고 기준을 세우는",
  water: "반응을 읽고 한 박자 늦추는",
};

const WEAK_ELEMENT_CARE_LINES: Record<ElementKey, string> = {
  wood: "목 기운이 약한 편이라 시작을 미루지 않게 첫 단추를 작게라도 끼워 두는 편이 좋아요.",
  fire: "화 기운이 약한 편이라 답답함을 안에만 쌓아 두지 말고 반응을 조금 더 밖으로 꺼내는 편이 좋아요.",
  earth: "토 기운이 약한 편이라 흔들리는 날엔 일정과 휴식 틀을 먼저 고정해 두는 편이 좋아요.",
  metal: "금 기운이 약한 편이라 기준이 흐려지지 않게 우선순위를 짧게라도 적어 두는 편이 좋아요.",
  water: "수 기운이 약한 편이라 과열되기 쉬워서 쉬는 간격과 감정 정리를 먼저 챙기는 편이 좋아요.",
};

function getGeneratedBy(element: ElementKey): ElementKey {
  const matched = Object.entries(GENERATES).find(([, value]) => value === element)?.[0] as ElementKey | undefined;
  return matched ?? "water";
}

function getControlledBy(element: ElementKey): ElementKey {
  const matched = Object.entries(CONTROLS).find(([, value]) => value === element)?.[0] as ElementKey | undefined;
  return matched ?? "earth";
}

function sortElements(balance: FiveElementsBalance): Array<[ElementKey, number]> {
  return (Object.entries(balance) as Array<[ElementKey, number]>).sort((a, b) => b[1] - a[1]);
}

function uniqueElements(elements: ElementKey[]): ElementKey[] {
  return Array.from(new Set(elements));
}

export function joinElementLabels(elements: ElementKey[]) {
  return uniqueElements(elements).map(elementLabel).join("·");
}

function pillarStem(pillars: SajuPillarsSnapshot | undefined, pillar: PillarKey) {
  const raw = pillars?.[pillar]?.trim();
  return raw ? raw[0] : undefined;
}

function pillarBranch(pillars: SajuPillarsSnapshot | undefined, pillar: PillarKey) {
  const raw = pillars?.[pillar]?.trim();
  return raw && raw.length >= 2 ? raw.slice(1) : undefined;
}

function branchWeight(pillar: PillarKey) {
  if (pillar === "month") return 12;
  if (pillar === "day") return 8;
  return 4;
}

function getTenGodCode(dayMaster: StemMeta, other: StemMeta): SajuTenGodCode {
  const samePolarity = dayMaster.yinYang === other.yinYang;

  if (dayMaster.element === other.element) {
    return samePolarity ? "peer" : "rival";
  }

  if (GENERATES[dayMaster.element] === other.element) {
    return samePolarity ? "food" : "hurting";
  }

  if (CONTROLS[dayMaster.element] === other.element) {
    return samePolarity ? "indirectWealth" : "directWealth";
  }

  if (getControlledBy(dayMaster.element) === other.element) {
    return samePolarity ? "sevenKillings" : "directOfficer";
  }

  return samePolarity ? "indirectResource" : "directResource";
}

function buildTenGodSummary(dayMaster: StemMeta, pillar: PillarKey, stem: string): SajuTenGodInsight {
  const other = STEM_META[stem];

  if (!other) {
    return {
      pillar,
      stem,
      summary: `${pillar} 기둥의 천간 ${stem}은 아직 해석 규칙에 연결되지 않았어요.`,
    };
  }

  if (pillar === "day") {
    return {
      pillar,
      stem,
      summary: `일간 ${dayMaster.label}이 이 명식의 기준축입니다.`,
    };
  }

  const code = getTenGodCode(dayMaster, other);
  const pillarLabel = pillar === "year" ? "연간" : pillar === "month" ? "월간" : "시간";
  const relationLabel =
    code === "peer" || code === "rival"
      ? "자기 확장과 경쟁 감각"
      : code === "food" || code === "hurting"
        ? "표현력과 출력"
        : code === "indirectWealth" || code === "directWealth"
          ? "현실 감각과 관계 운영"
          : code === "sevenKillings" || code === "directOfficer"
            ? "책임감과 압박 대응"
            : "학습력과 회복력";

  return {
    pillar,
    stem,
    code,
    summary: `${pillarLabel} ${stem}은 ${getTenGodLabel(code)}으로 읽히며, ${relationLabel}을 강조합니다.`,
  };
}

export function elementLabel(element: ElementKey) {
  return ELEMENT_LABELS[element];
}

export function getSeasonLabel(season: SajuSeason) {
  const labels: Record<SajuSeason, string> = {
    spring: "봄",
    summer: "여름",
    transition: "환절기",
    autumn: "가을",
    winter: "겨울",
  };
  return labels[season];
}

export function getStrengthLabel(level: SajuStrengthLevel) {
  if (level === "strong") return "신강한 편";
  if (level === "weak") return "신약한 편";
  return "균형에 가까움";
}

export function getTenGodLabel(code: SajuTenGodCode) {
  return TEN_GOD_LABELS[code];
}

export function getElementApproachHint(element: ElementKey) {
  return ELEMENT_APPROACH_HINTS[element];
}

export function getWeakElementCareLine(element: ElementKey) {
  return WEAK_ELEMENT_CARE_LINES[element];
}

export function getStrengthSupportLine(
  level: SajuStrengthLevel,
  usefulElements: ElementKey[],
  fallbackElement: ElementKey,
) {
  const labels = joinElementLabels(usefulElements.length ? usefulElements : [fallbackElement]);

  if (level === "weak") {
    return `${labels} 쪽이 받쳐 주면 버티는 힘이 붙고 마음도 한결 안정돼요.`;
  }
  if (level === "strong") {
    return `${labels} 쪽 움직임을 쓰면 힘이 한곳에 몰리지 않고 말과 행동이 더 유연해져요.`;
  }
  return `${labels} 쪽으로 힘을 실으면 속도와 안정감이 같이 살아나요.`;
}

export function getAnalysisReactionLine(analysis: SajuAnalysis) {
  if (!isChartDerivedAnalysis(analysis)) {
    return `지금은 ${elementLabel(analysis.dayMasterElement)} 기운이 먼저 살아나는 흐름으로 읽고 있어요.`;
  }

  return `${analysis.dayMasterLabel} 일간은 관계에서도 ${ELEMENT_REACTION_HINTS[analysis.dayMasterElement]}이 보일 때 먼저 반응하는 편이에요.`;
}

export function getUsefulApproachLine(elements: ElementKey[], fallbackElement: ElementKey) {
  const primary = elements[0] ?? fallbackElement;
  const labels = joinElementLabels(elements.length ? elements : [fallbackElement]);
  return `${labels} 쪽이 필요한 날에는 ${getElementApproachHint(primary)} 방식이 잘 맞아요.`;
}

function normalizeElementList(
  values: Array<ElementKey | undefined> | undefined,
  fallback: ElementKey[],
) {
  const resolved = (values ?? []).filter((value): value is ElementKey => Boolean(value));
  return resolved.length ? uniqueElements(resolved) : fallback;
}

function normalizeSummaryLines(lines: string[] | undefined, fallback: string[]) {
  const filtered = (lines ?? []).map((line) => line.trim()).filter(Boolean);
  return filtered.length ? filtered.slice(0, 3) : fallback.slice(0, 3);
}

export function normalizeProviderAnalysis(
  basis?: ProviderSajuBasisV2,
  breakdown?: ProviderElementBreakdownV2,
): SajuAnalysis | undefined {
  if (!basis) return undefined;

  const summaryFallback = [
    `${basis.dayMasterLabel} 일간은 관계에서도 ${ELEMENT_REACTION_HINTS[basis.dayMasterElement]}이 보일 때 먼저 반응하는 편이에요.`,
    getStrengthSupportLine(basis.strengthLevel, basis.usefulElements, basis.dominantElement),
    getWeakElementCareLine(basis.weakestElement),
  ];

  const elementBreakdown: SajuElementBreakdown | undefined = breakdown
    ? {
        ruleVersion: breakdown.ruleVersion,
        stemContribution: breakdown.stemContribution,
        branchContribution: breakdown.branchContribution,
        monthBranchBonusContribution: breakdown.monthBranchBonusContribution,
        hiddenStemContribution: breakdown.hiddenStemContribution,
        overlapMonthBonusHiddenEarth: breakdown.overlapMonthBonusHiddenEarth,
        earthDampeningEnabled: breakdown.earthDampeningEnabled,
        earthDampeningStrength: breakdown.earthDampeningStrength,
        earthDampeningApplied: breakdown.earthDampeningApplied,
        rawScore: breakdown.rawScore,
        finalNormalized: breakdown.finalNormalized,
        winner: breakdown.winner,
      }
    : undefined;

  return {
    source: "chart-derived",
    basisOrigin: "provider",
    dayMasterStem: basis.dayMasterStem,
    dayMasterLabel: basis.dayMasterLabel,
    dayMasterElement: basis.dayMasterElement,
    dayMasterYinYang: basis.dayMasterYinYang,
    monthBranch: basis.monthBranch,
    monthBranchLabel: basis.monthBranchLabel,
    season: basis.season,
    dominantElement: basis.dominantElement,
    weakestElement: basis.weakestElement,
    strengthLevel: basis.strengthLevel,
    strengthScore: basis.strengthScore,
    supportScore: basis.supportScore,
    regulatingScore: basis.regulatingScore,
    seasonalBonus: basis.seasonalBonus,
    rootSupportScore: basis.rootSupportScore,
    strengthReason: basis.strengthReason,
    supportElements: normalizeElementList(basis.supportElements, [basis.dayMasterElement]),
    usefulElements: normalizeElementList(basis.usefulElements, [basis.dominantElement]),
    cautionElements: normalizeElementList(basis.cautionElements, [basis.weakestElement]),
    tenGods: basis.tenGods ?? [],
    summaryLines: normalizeSummaryLines(basis.summaryLines, summaryFallback),
    pillarDetails: basis.pillarDetails,
    elementBreakdown,
    notes: basis.notes,
  };
}

export function isChartDerivedAnalysis(analysis: SajuAnalysis) {
  return analysis.source === "chart-derived" && !!analysis.dayMasterStem;
}

export function getAnalysisHeadlineLabel(analysis: SajuAnalysis) {
  return isChartDerivedAnalysis(analysis) ? analysis.dayMasterLabel : "오행 기반 임시 해석";
}

export function getAnalysisIdentityLabel(analysis: SajuAnalysis) {
  return isChartDerivedAnalysis(analysis) ? analysis.dayMasterLabel : `${elementLabel(analysis.dayMasterElement)} 기운 중심`;
}

export function getAnalysisSubjectPhrase(analysis: SajuAnalysis) {
  return isChartDerivedAnalysis(analysis)
    ? `${analysis.dayMasterLabel} 일간은`
    : `${elementLabel(analysis.dayMasterElement)} 기운이 중심인 흐름에서는`;
}

export function getAnalysisBasisPhrase(analysis: SajuAnalysis) {
  return isChartDerivedAnalysis(analysis)
    ? `${analysis.dayMasterLabel} 기준으로`
    : `${elementLabel(analysis.dayMasterElement)} 기운 기준으로`;
}

export function getAnalysisFallbackNote(analysis: SajuAnalysis) {
  if (isChartDerivedAnalysis(analysis)) return "";
  return "원국 기둥을 불러오지 못해 오행 균형 기반으로 임시 해석 중이에요.";
}

export function describeStem(stem?: string) {
  const meta = stem ? STEM_META[stem] : undefined;
  if (!meta || !stem) return "천간 정보를 아직 읽지 못했어요.";
  return `${stem} · ${meta.label} · ${elementLabel(meta.element)} 기운`;
}

export function describeBranch(branch?: string) {
  const meta = branch ? BRANCH_META[branch] : undefined;
  if (!meta || !branch) return "지지 정보를 아직 읽지 못했어요.";
  return `${branch} · ${meta.label} · ${getSeasonLabel(meta.season)} 흐름`;
}

export function deriveSajuAnalysis(balance: FiveElementsBalance, pillars?: SajuPillarsSnapshot): SajuAnalysis {
  const sorted = sortElements(balance);
  const dominantElement = sorted[0]?.[0] ?? "earth";
  const weakestElement = sorted[sorted.length - 1]?.[0] ?? "water";
  const dayStem = pillarStem(pillars, "day");
  const monthBranch = pillarBranch(pillars, "month");
  const dayStemMeta = dayStem ? STEM_META[dayStem] : undefined;
  const monthBranchMeta = monthBranch ? BRANCH_META[monthBranch] : undefined;

  const dayMasterElement = dayStemMeta?.element ?? dominantElement;
  const resourceElement = getGeneratedBy(dayMasterElement);
  const outputElement = GENERATES[dayMasterElement];
  const wealthElement = CONTROLS[dayMasterElement];
  const officerElement = getControlledBy(dayMasterElement);
  const supportElements = uniqueElements([dayMasterElement, resourceElement]);

  let rootSupport = 0;
  if (pillars) {
    (["year", "month", "day", "hour"] as PillarKey[]).forEach((pillar) => {
      const branch = pillarBranch(pillars, pillar);
      const meta = branch ? BRANCH_META[branch] : undefined;
      if (!meta) return;
      if (supportElements.includes(meta.element)) {
        rootSupport += branchWeight(pillar);
      }
    });
  }

  const seasonalBonus = monthBranchMeta
    ? supportElements.includes(monthBranchMeta.element)
      ? 18
      : [outputElement, wealthElement].includes(monthBranchMeta.element)
        ? -6
        : officerElement === monthBranchMeta.element
          ? -10
          : 0
    : 0;

  const supportScore = balance[dayMasterElement] + balance[resourceElement] + seasonalBonus + rootSupport;
  const regulatingScore = balance[outputElement] + balance[wealthElement] + balance[officerElement];
  const strengthScore = supportScore - regulatingScore;

  const strengthLevel: SajuStrengthLevel =
    strengthScore >= 24 ? "strong" : strengthScore <= -12 ? "weak" : "balanced";

  const usefulElements =
    strengthLevel === "strong"
      ? uniqueElements([outputElement, wealthElement, officerElement])
      : strengthLevel === "weak"
        ? supportElements
        : uniqueElements([outputElement, wealthElement]);

  const cautionElements =
    strengthLevel === "strong"
      ? supportElements
      : strengthLevel === "weak"
        ? uniqueElements([officerElement, wealthElement])
        : uniqueElements([resourceElement, officerElement]);

  const tenGods = pillars && dayStemMeta
    ? (["year", "month", "day", "hour"] as PillarKey[])
        .map((pillar) => buildTenGodSummary(dayStemMeta, pillar, pillarStem(pillars, pillar) ?? ""))
        .filter((item) => item.summary)
    : [];

  const source = pillars?.day ? "chart-derived" : "balance-derived";
  const strengthReason = source === "chart-derived"
    ? `${monthBranchMeta?.label ?? "월지"}의 계절감과 ${joinElementLabels(supportElements)} 쪽 비중을 함께 보면 ${getStrengthLabel(strengthLevel)}으로 해석돼요.`
    : `${joinElementLabels(supportElements)} 쪽 비중이 받쳐 주는 구조라 ${getStrengthLabel(strengthLevel)}에 가깝다고 봐요.`;

  return {
    source,
    dayMasterStem: dayStem,
    dayMasterLabel: dayStemMeta?.label ?? `${elementLabel(dayMasterElement)} 기운 중심`,
    dayMasterElement,
    dayMasterYinYang: dayStemMeta?.yinYang,
    monthBranch,
    monthBranchLabel: monthBranchMeta?.label,
    season: monthBranchMeta?.season ?? "transition",
    dominantElement,
    weakestElement,
    strengthLevel,
    strengthScore,
    strengthReason,
    supportElements,
    usefulElements,
    cautionElements,
    tenGods,
    summaryLines: [
      dayStemMeta
        ? `${dayStemMeta.label} 일간은 관계에서도 ${ELEMENT_REACTION_HINTS[dayMasterElement]}이 보일 때 먼저 마음이 움직이는 편이에요.`
        : `지금은 ${elementLabel(dayMasterElement)} 기운이 먼저 살아나는 흐름으로 읽고 있어요.`,
      getStrengthSupportLine(strengthLevel, usefulElements, dominantElement),
      getWeakElementCareLine(weakestElement),
    ],
  };
}

export function buildProfileCopy(balance: FiveElementsBalance, analysis: SajuAnalysis): Pick<SajuProfile, "personalitySummary" | "loveStyle" | "idealTraits"> {
  const usefulLabel = joinElementLabels(analysis.usefulElements);
  const supportLabel = joinElementLabels(analysis.supportElements);
  const cautionLabel = joinElementLabels(analysis.cautionElements);
  const seasonLabel = getSeasonLabel(analysis.season);
  const dominantValue = balance[analysis.dominantElement];
  const weakValue = balance[analysis.weakestElement];
  const subjectPhrase = getAnalysisSubjectPhrase(analysis);

  const personalitySummary =
    analysis.strengthLevel === "strong"
      ? `${subjectPhrase} ${seasonLabel} 흐름을 타면 판단과 추진이 빠르게 붙는 편이에요. 한 번 방향을 잡으면 밀고 가는 힘이 분명하지만, ${cautionLabel} 쪽으로 과열되면 말이 단정적으로 들릴 수 있어요. 강한 축은 ${elementLabel(analysis.dominantElement)}(${dominantValue}%)라 주도권과 추진력은 이미 충분한 편이에요.`
      : analysis.strengthLevel === "weak"
        ? `${subjectPhrase} ${seasonLabel} 흐름에서는 사람과 분위기 변화를 읽는 감각이 좋은 편이에요. 대신 혼자 버티려 들수록 소모가 빨라질 수 있어 ${supportLabel} 쪽 도움이 들어올 때 안정감과 집중력이 함께 붙어요. 특히 약한 ${elementLabel(analysis.weakestElement)}(${weakValue}%) 축은 일상 리듬으로 받쳐 주는 편이 좋아요.`
        : `${subjectPhrase} ${seasonLabel} 흐름에서는 밀고 나갈 때와 맞춰 줄 때의 균형이 비교적 좋은 편이에요. 필요할 때 선을 세우고, 필요할 때 부드럽게 받쳐 주는 방식이 잘 맞아요.`;

  const loveStyle =
    analysis.strengthLevel === "strong"
      ? `호감이 생기면 관계의 방향을 먼저 잡고 싶어지는 편이에요. 그래서 ${usefulLabel} 쪽 감각처럼 숨을 고를 여지를 주고 대화 톤을 눌러 주는 상대와 호흡이 좋아요.`
      : analysis.strengthLevel === "weak"
        ? `마음을 열기 전까지는 시간이 조금 필요한 편이에요. 대신 한번 신뢰가 쌓이면 오래 가는 힘이 있어 ${supportLabel} 쪽 안정감을 주는 관계와 특히 잘 맞아요.`
        : `대화 템포와 현실 감각이 함께 맞을 때 관계가 깊어지는 편이에요. 감정 표현과 일상 조율이 같이 되는 사람 앞에서 강점이 더 선명하게 드러납니다.`;

  const idealTraits =
    analysis.strengthLevel === "strong"
      ? [
          `${usefulLabel} 쪽 감각처럼 여백과 조율이 자연스러운 사람`,
          "내 속도를 받아주되 필요할 때는 브레이크를 걸어 줄 수 있는 사람",
          "감정 표현이 과하지 않고 안정감 있게 이어지는 사람",
        ]
      : analysis.strengthLevel === "weak"
        ? [
          `${supportLabel} 쪽 안정감처럼 곁을 단단히 잡아 주는 사람`,
          "약속과 일상 패턴이 크게 흔들리지 않는 사람",
          "천천히 가까워져도 관계를 꾸준히 이어 갈 수 있는 사람",
        ]
      : [
          "말의 톤이 편안하고 기본 리듬이 비슷한 사람",
          "감정 공감과 현실 감각을 같이 갖춘 사람",
          "밀어붙이기보다 호흡을 맞춰 가는 사람",
        ];

  return {
    personalitySummary,
    loveStyle,
    idealTraits,
  };
}
