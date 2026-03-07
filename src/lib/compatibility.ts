import type { Gender } from '../types/saju';

export interface PartnerInput {
  birthDate: string;
  birthTime: string;
  gender: Gender;
}

export interface CompatibilityResult {
  score: number;
  strengths: string[];
  cautions: string[];
  summary: string;
}

export function calculateCompatibility(
  myBirthDate: string,
  myBirthTime: string,
  partner: PartnerInput,
): CompatibilityResult {
  const seed = (myBirthDate + myBirthTime + partner.birthDate + partner.birthTime)
    .split('')
    .reduce((sum, ch) => sum + ch.charCodeAt(0), 0);

  const score = 60 + (seed % 41);

  return {
    score,
    strengths: ['감정 템포가 비슷함', '생활 루틴의 보완 효과', '장기 목표의 합이 좋음'],
    cautions: ['의사결정 속도 차이', '갈등 시 침묵 패턴'],
    summary: generateCompatibilitySummary(score),
  };
}

export function generateCompatibilitySummary(score: number): string {
  if (score >= 90) return '운명형 궁합. 안정감과 끌림이 동시에 강합니다.';
  if (score >= 80) return '우수한 궁합. 관계를 키우기 좋은 조합입니다.';
  if (score >= 70) return '발전형 궁합. 대화 방식 정렬이 중요합니다.';
  return '탐색형 궁합. 기대치 조율이 핵심 포인트입니다.';
}
