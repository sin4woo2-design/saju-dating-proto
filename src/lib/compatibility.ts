import type { Gender } from "../types/saju";

interface PairInput {
  birthDate: string;
  birthTime: string;
  gender: Gender;
}

export function calculateCompatibility(me: PairInput, partner: PairInput): number {
  const seed = `${me.birthDate}${me.birthTime}${me.gender}${partner.birthDate}${partner.birthTime}${partner.gender}`
    .split("")
    .reduce((sum, ch) => sum + ch.charCodeAt(0), 0);
  return 60 + (seed % 41);
}

export function generateCompatibilitySummary(score: number): { strengths: string[]; cautions: string[] } {
  if (score >= 85) {
    return {
      strengths: ["감정 교류가 자연스럽고 템포가 잘 맞음", "장기 관계로 발전할 가능성이 높음"],
      cautions: ["지나친 확신보다 현실적인 조율 필요"],
    };
  }

  if (score >= 72) {
    return {
      strengths: ["상호 보완 포인트가 분명함", "같이 성장할 여지가 큼"],
      cautions: ["의사결정 속도 차이 조율 필요", "표현 방식의 온도 차이 주의"],
    };
  }

  return {
    strengths: ["새로운 관점을 배우기 좋은 조합"],
    cautions: ["감정 표현 규칙을 초반에 맞추는 것이 중요", "기대치 조율 필요"],
  };
}
