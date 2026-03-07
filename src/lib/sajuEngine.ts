import type { FiveElementsBalance, SajuResult, UserProfileInput } from '../types/saju';

export function calculateSaju(input: UserProfileInput): SajuResult {
  const fiveElements = getFiveElementsBalance(input.birthDate, input.birthTime);

  return {
    pillars: ['갑자', '병인', '정묘', '기유'],
    fiveElements,
    personalitySummary: generatePersonalitySummary(fiveElements),
    loveStyle: '상대를 천천히 알아가며 신뢰를 쌓는 깊은 관계형 연애 스타일',
    idealPartnerTraits: ['정서적으로 안정된 사람', '성장 의지가 있는 사람', '솔직하게 소통하는 사람'],
  };
}

export function getFiveElementsBalance(_birthDate: string, _birthTime: string): FiveElementsBalance {
  return {
    wood: 68,
    fire: 56,
    earth: 74,
    metal: 43,
    water: 81,
  };
}

export function generatePersonalitySummary(balance: FiveElementsBalance): string {
  const top = Object.entries(balance).sort((a, b) => b[1] - a[1])[0][0];
  return `당신은 ${top} 기운이 강한 편으로 직관이 좋고, 관계에서 진정성과 일관성을 중요하게 생각합니다.`;
}
