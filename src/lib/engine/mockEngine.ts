import { elementLabels } from "../../constants/labels";
import type { FiveElementsBalance, SajuProfile, UserProfileInput } from "../../types/saju";
import type { PairInput, SajuEngine } from "./types";

function seeded(input: UserProfileInput) {
  return `${input.name}-${input.birthDate}-${input.birthTime}-${input.gender}`
    .split("")
    .reduce((sum, ch) => sum + ch.charCodeAt(0), 0);
}

function seedOf(value: PairInput) {
  return `${value.birthDate}-${value.birthTime}-${value.gender}`
    .split("")
    .reduce((sum, ch) => sum + ch.charCodeAt(0), 0);
}

export function getFiveElementsBalance(seed = 100): FiveElementsBalance {
  const base = {
    wood: 45 + (seed % 42),
    fire: 38 + ((seed * 3) % 45),
    earth: 40 + ((seed * 5) % 41),
    metal: 35 + ((seed * 7) % 46),
    water: 42 + ((seed * 11) % 44),
  };

  return {
    wood: Math.min(95, base.wood),
    fire: Math.min(95, base.fire),
    earth: Math.min(95, base.earth),
    metal: Math.min(95, base.metal),
    water: Math.min(95, base.water),
  };
}

export function generatePersonalitySummary(balance: FiveElementsBalance): string {
  const sorted = Object.entries(balance).sort((a, b) => b[1] - a[1]);
  const strongest = elementLabels[sorted[0][0]];
  const weaker = elementLabels[sorted[4][0]];
  return `${strongest} 기운이 중심이라 관계에서 진정성과 몰입도가 높아요. 다만 ${weaker} 에너지가 약해 피곤할 때는 감정 표현이 줄어들 수 있어요.`;
}

function generateLoveStyle(balance: FiveElementsBalance): string {
  const fire = balance.fire;
  const water = balance.water;

  if (fire > 75 && water > 70) {
    return "감정 표현은 따뜻하고 빠르지만, 중요한 순간엔 신중하게 균형을 잡는 타입이에요.";
  }
  if (fire < 55 && water > 75) {
    return "처음엔 천천히 마음을 열지만 신뢰가 생기면 오래 깊게 이어가는 타입이에요.";
  }
  if (fire > 75) {
    return "호감이 생기면 적극적으로 표현하고, 관계 분위기를 리드하는 타입이에요.";
  }

  return "상대를 충분히 관찰한 뒤 안정감을 느끼면 자연스럽게 애정 표현이 커지는 타입이에요.";
}

function generateIdealTraits(balance: FiveElementsBalance): string[] {
  const sorted = Object.entries(balance).sort((a, b) => b[1] - a[1]);
  const main = sorted[0][0];

  const common = ["감정 소통이 솔직한 사람", "생활 리듬이 안정적인 사람"];

  if (main === "water") {
    return [...common, "깊은 대화를 즐기는 사람"];
  }
  if (main === "wood") {
    return [...common, "함께 성장 목표를 나누는 사람"];
  }
  if (main === "fire") {
    return [...common, "에너지와 리액션이 좋은 사람"];
  }
  if (main === "earth") {
    return [...common, "일상 습관이 성실한 사람"];
  }
  return [...common, "기준이 분명하고 약속을 잘 지키는 사람"];
}

function calculateSajuProfile(input: UserProfileInput): SajuProfile {
  const seed = seeded(input);
  const fiveElements = getFiveElementsBalance(seed);
  return {
    fiveElements,
    personalitySummary: generatePersonalitySummary(fiveElements),
    loveStyle: generateLoveStyle(fiveElements),
    idealTraits: generateIdealTraits(fiveElements),
  };
}

function calculateCompatibilityScore(me: PairInput, partner: PairInput): number {
  const meSeed = seedOf(me);
  const partnerSeed = seedOf(partner);
  const gap = Math.abs(meSeed - partnerSeed) % 34;
  const boost = (me.gender === partner.gender ? 2 : 6) + ((meSeed + partnerSeed) % 11);
  const score = 65 + boost - Math.floor(gap / 4);
  return Math.max(58, Math.min(96, score));
}

export const mockEngine: SajuEngine = {
  mode: "mock",
  calculateSaju(input) {
    return {
      source: "mock",
      profile: calculateSajuProfile(input),
    };
  },
  calculateCompatibility(me, partner) {
    return {
      source: "mock",
      score: calculateCompatibilityScore(me, partner),
    };
  },
};
