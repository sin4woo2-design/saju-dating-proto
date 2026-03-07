import type { FiveElementsBalance, SajuProfile, UserProfileInput } from "../types/saju";

export function calculateSaju(_input: UserProfileInput): SajuProfile {
  const fiveElements = getFiveElementsBalance();
  return {
    fiveElements,
    personalitySummary: generatePersonalitySummary(fiveElements),
    loveStyle: "신뢰가 쌓일수록 깊어지는 타입. 표현은 신중하지만 진심은 강한 편.",
    idealTraits: ["정서적으로 안정적인 사람", "성장 지향적인 사람", "깊은 대화가 되는 사람"],
  };
}

export function getFiveElementsBalance(): FiveElementsBalance {
  return {
    wood: 72,
    fire: 55,
    earth: 64,
    metal: 43,
    water: 86,
  };
}

export function generatePersonalitySummary(balance: FiveElementsBalance): string {
  const strongest = Object.entries(balance).sort((a, b) => b[1] - a[1])[0][0];
  return `당신은 ${strongest} 기운이 강해 직관과 공감 능력이 좋고, 관계에서 진정성을 중요하게 여깁니다.`;
}
