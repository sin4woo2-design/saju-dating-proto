import { calculateCompatibilityWithEngine } from "./engine";
import type { Gender } from "../types/saju";

interface PairInput {
  birthDate: string;
  birthTime: string;
  gender: Gender;
}

/**
 * Legacy export 유지: 기존 페이지 코드 호환용.
 * 실제 점수 계산 공급자는 엔진 라우터에서 선택된다.
 */
export function calculateCompatibility(me: PairInput, partner: PairInput): number {
  return calculateCompatibilityWithEngine(me, partner).score;
}

export function generateCompatibilitySummary(score: number): { strengths: string[]; cautions: string[] } {
  if (score >= 88) {
    return {
      strengths: [
        "대화 템포와 감정 리듬이 자연스럽게 맞는 편",
        "갈등이 생겨도 회복 속도가 빠른 궁합",
      ],
      cautions: ["호흡이 잘 맞을수록 현실적인 역할 분담을 더 분명히 정하면 좋아요."],
    };
  }

  if (score >= 78) {
    return {
      strengths: [
        "서로 다른 장점을 보완해 함께 성장하기 좋은 조합",
        "장기 관계로 갈수록 안정감이 높아지는 타입",
      ],
      cautions: [
        "결정 속도 차이가 날 때 중간 체크포인트를 잡아두면 좋아요.",
        "감정 표현 방식의 온도차를 초반에 맞추는 것이 중요해요.",
      ],
    };
  }

  if (score >= 68) {
    return {
      strengths: ["새로운 관점을 배울 수 있는 학습형 궁합", "초반에 규칙을 맞추면 관계 밀도가 올라갈 가능성"],
      cautions: [
        "연락 주기와 데이트 스타일 같은 생활 리듬 조율이 먼저 필요해요.",
        "감정이 쌓이기 전 작은 불편함도 바로 말하는 습관이 중요해요.",
      ],
    };
  }

  return {
    strengths: ["서로 다른 성향이라 오히려 강한 매력을 느낄 수 있어요."],
    cautions: [
      "기대치와 경계선을 명확히 정하지 않으면 소모가 커질 수 있어요.",
      "서로의 표현법을 해석하는 시간을 충분히 확보해보세요.",
    ],
  };
}
