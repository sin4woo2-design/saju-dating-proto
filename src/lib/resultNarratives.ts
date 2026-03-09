import type { FiveElementsBalance } from "../types/saju";

const personalityPool: Record<string, string[]> = {
  wood: ["아이디어를 빠르게 실행에 옮기는 추진형 기질이 강해요.", "관계에서도 성장 방향이 보이면 몰입도가 크게 올라가요."],
  fire: ["감정 온도가 높고 리액션이 좋아 분위기를 살리는 편이에요.", "호감이 생기면 표현이 빠르고 솔직한 편이에요."],
  earth: ["관계를 안정적으로 운영하는 힘이 강한 현실형 기질이에요.", "신뢰가 쌓이면 오래 가는 패턴을 선호해요."],
  metal: ["기준이 분명하고 약속/원칙을 중요하게 보는 편이에요.", "관계의 질을 높이기 위해 경계선 설정을 잘해요."],
  water: ["감정과 맥락을 섬세하게 읽는 공감형 기질이 강해요.", "깊은 대화에서 연결감을 크게 느끼는 타입이에요."],
};

const loveStylePool: Record<string, string[]> = {
  wood: ["함께 배우고 성장하는 연애를 할 때 만족도가 높아요.", "관계에 방향성이 생기면 애정 표현이 더 안정적으로 늘어요."],
  fire: ["좋아하는 감정을 따뜻하고 적극적으로 표현하는 편이에요.", "초반 친밀도 형성이 빠른 대신 템포 조율이 중요해요."],
  earth: ["일상 루틴을 함께 만들며 안정감을 키우는 연애에 강해요.", "작은 약속을 꾸준히 지키는 패턴에서 신뢰가 커져요."],
  metal: ["관계 기준을 명확히 합의할 때 가장 편안함을 느껴요.", "대화에서 논리/일관성이 맞으면 깊은 신뢰로 이어져요."],
  water: ["감정 공감과 대화 밀도가 높은 관계에서 에너지가 살아나요.", "마음을 열기까지 신중하지만, 열리면 오래 깊게 가는 편이에요."],
};

const idealPartnerPool: Record<string, string[]> = {
  wood: ["성장 목표를 같이 설계할 수 있는 사람", "호기심을 존중하고 새 시도를 응원해주는 사람"],
  fire: ["감정 표현이 자연스럽고 리액션이 따뜻한 사람", "활동적인 데이트를 즐기면서도 배려가 섬세한 사람"],
  earth: ["생활 패턴이 안정적이고 책임감 있는 사람", "관계를 천천히 단단하게 쌓는 스타일의 사람"],
  metal: ["기준이 분명하고 약속을 정확히 지키는 사람", "대화에서 정리력과 신뢰를 주는 사람"],
  water: ["깊은 대화를 즐기고 감정 공감이 좋은 사람", "서로의 내면 리듬을 존중해주는 사람"],
};

const cautionPool: Record<string, string[]> = {
  wood: ["속도 차이가 나면 답답함이 커질 수 있어요.", "결정 전에 상대 템포를 확인하는 습관이 필요해요."],
  fire: ["감정 표현 격차가 크면 오해가 생기기 쉬워요.", "중요 대화는 톤을 낮춰 핵심부터 확인해보세요."],
  earth: ["관계가 고정 루틴만 반복되면 설렘이 줄 수 있어요.", "주기적으로 새로운 경험을 넣어 리듬을 환기하세요."],
  metal: ["기준 충돌 시 냉각 기간이 길어질 수 있어요.", "초반에 경계선/기대치를 명확히 맞추면 좋아요."],
  water: ["감정 과몰입 시 회복 시간이 길어질 수 있어요.", "갈등 후 재대화 시간을 미리 약속해 두세요."],
};

function sortedElements(balance: FiveElementsBalance) {
  return Object.entries(balance).sort((a, b) => b[1] - a[1]);
}

export function buildSajuNarratives(balance: FiveElementsBalance) {
  const sorted = sortedElements(balance);
  const strong = sorted[0][0];
  const weak = sorted[sorted.length - 1][0];

  return {
    reasonCard: [
      `강한 기운: ${strong} (${sorted[0][1]})`,
      `보완 기운: ${weak} (${sorted[sorted.length - 1][1]})`,
      "이 조합을 기준으로 성격/연애/관계 패턴 문구가 생성됐어요.",
    ],
    personality: personalityPool[strong] ?? personalityPool.earth,
    loveStyle: loveStylePool[strong] ?? loveStylePool.earth,
    idealPartner: idealPartnerPool[strong] ?? idealPartnerPool.earth,
    cautionPatterns: cautionPool[weak] ?? cautionPool.water,
  };
}

export function buildCompatibilityNarratives(score: number) {
  const talk = Math.max(45, Math.min(98, score + (score > 85 ? 2 : 5)));
  const emotion = Math.max(40, Math.min(98, score - 2));
  const lifestyle = Math.max(42, Math.min(98, score + (score > 82 ? -3 : 3)));

  const explain = [
    `전체 점수 ${score}점을 대화/감정/생활 3축으로 분해해 하위 지표를 만들었어요.`,
    `대화 ${talk} · 감정 ${emotion} · 생활 ${lifestyle}`,
  ];

  const conflict = [
    talk < 72 ? "대화 속도와 결론 시점이 달라 답답함이 생길 수 있어요." : "합의가 빠른 편이라 감정 체크를 생략하지 않는 게 중요해요.",
    lifestyle < 74 ? "생활 루틴/연락 빈도 기준을 먼저 정해야 충돌이 줄어요." : "역할 분담을 명확히 하면 안정감이 더 커져요.",
  ];

  const tips = [
    emotion < 70 ? "감정 확인 질문(지금 어떤 기분이야?)을 정기적으로 써보세요." : "좋았던 대화 패턴을 템플릿처럼 반복하면 관계 질이 올라가요.",
    "갈등 상황에서는 사실-해석-요청 순서로 말하면 회복 속도가 빨라져요.",
  ];

  return { talk, emotion, lifestyle, explain, conflict, tips };
}
