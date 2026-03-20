import type {
  ElementKey,
  FiveElementsBalance,
  SajuAnalysis,
  SajuPillarsSnapshot,
  SajuProfile,
  SajuSeason,
  SajuStrengthLevel,
  SajuTenGodCode,
  SajuTenGodInsight,
  YinYang,
} from "../types/saju";

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
    ? `${monthBranchMeta?.label ?? "월지"}의 계절감과 ${supportElements.map(elementLabel).join("·")} 기운 비중을 함께 보면 ${getStrengthLabel(strengthLevel)}으로 해석돼요.`
    : `${supportElements.map(elementLabel).join("·")} 기운 비중을 중심으로 보면 ${getStrengthLabel(strengthLevel)} 쪽에 가깝습니다.`;

  return {
    source,
    dayMasterStem: dayStem,
    dayMasterLabel: dayStemMeta?.label ?? `${elementLabel(dayMasterElement)} 일간 추정`,
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
      `${dayStemMeta?.label ?? `${elementLabel(dayMasterElement)} 기운`}이 기준축이라 관계를 읽을 때도 ${elementLabel(dayMasterElement)} 기운의 쓰임을 먼저 봅니다.`,
      `${getStrengthLabel(strengthLevel)}이라 ${usefulElements.map(elementLabel).join("·")} 기운을 활용할수록 흐름이 부드러워집니다.`,
      `${elementLabel(weakestElement)} 기운이 가장 약해 생활 루틴에서는 이 축을 보완하는 편이 좋습니다.`,
    ],
  };
}

export function buildProfileCopy(balance: FiveElementsBalance, analysis: SajuAnalysis): Pick<SajuProfile, "personalitySummary" | "loveStyle" | "idealTraits"> {
  const usefulLabel = analysis.usefulElements.map(elementLabel).join("·");
  const supportLabel = analysis.supportElements.map(elementLabel).join("·");
  const cautionLabel = analysis.cautionElements.map(elementLabel).join("·");
  const seasonLabel = getSeasonLabel(analysis.season);
  const dominantValue = balance[analysis.dominantElement];
  const weakValue = balance[analysis.weakestElement];

  const personalitySummary =
    analysis.strengthLevel === "strong"
      ? `${analysis.dayMasterLabel} 일간은 ${seasonLabel} 흐름에서 힘을 받는 편이라 주도성과 판단 속도가 분명합니다. 다만 ${cautionLabel} 기운이 과해지면 단정적으로 보일 수 있어 속도를 조율할수록 강점이 살아납니다. 현재 강한 축은 ${elementLabel(analysis.dominantElement)}(${dominantValue}%)입니다.`
      : analysis.strengthLevel === "weak"
        ? `${analysis.dayMasterLabel} 일간은 ${seasonLabel} 흐름에서 기반을 다지며 힘을 쓰는 편이라, 사람과 환경의 흐름을 읽는 감각이 좋습니다. ${supportLabel} 기운을 채워 줄수록 안정감과 집중력이 함께 올라옵니다. 지금은 약한 ${elementLabel(analysis.weakestElement)}(${weakValue}%) 축을 보완하는 편이 좋아요.`
        : `${analysis.dayMasterLabel} 일간은 ${seasonLabel} 흐름에서 밀고 당기는 균형이 비교적 괜찮습니다. 주도할 때와 맞춰줄 때를 구분하면 존재감이 자연스럽게 드러납니다.`;

  const loveStyle =
    analysis.strengthLevel === "strong"
      ? `호감이 생기면 관계의 방향을 먼저 정하는 편입니다. 그래서 ${usefulLabel} 기운처럼 대화의 온도를 낮추고 여지를 남기는 상대와 호흡이 좋아집니다.`
      : analysis.strengthLevel === "weak"
        ? `신뢰와 안정감을 확인한 뒤 마음을 여는 편입니다. ${supportLabel} 기운을 보완해 주는 관계일수록 오래 갈 가능성이 큽니다.`
        : `대화와 리듬이 맞으면 관계 속도가 자연스럽게 붙는 편입니다. 감정 표현과 현실 조율이 함께 되는 관계에서 강점이 잘 드러납니다.`;

  const idealTraits =
    analysis.strengthLevel === "strong"
      ? [
          `${usefulLabel} 기운처럼 여백과 조율 감각이 있는 사람`,
          "내 속도를 받아주되 필요할 때는 브레이크를 걸어 줄 수 있는 사람",
          "감정 표현이 부드럽고 생활 리듬이 안정적인 사람",
        ]
      : analysis.strengthLevel === "weak"
        ? [
          `${supportLabel} 기운처럼 안정감과 지지력이 있는 사람`,
          "약속과 생활 패턴이 비교적 분명한 사람",
          "천천히 가까워져도 관계를 꾸준히 이어 갈 수 있는 사람",
        ]
      : [
          "말의 톤과 생활 리듬이 함께 맞는 사람",
          "감정 공감과 현실 감각을 같이 갖춘 사람",
          "밀어붙이기보다 자연스럽게 합을 맞춰 가는 사람",
        ];

  return {
    personalitySummary,
    loveStyle,
    idealTraits,
  };
}
