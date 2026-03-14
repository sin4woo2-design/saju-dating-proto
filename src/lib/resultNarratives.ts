import type { FiveElementsBalance } from "../types/saju";
import type { CompatibilityBasisV1, CompatibilityConfidenceLevel, CompatibilityRawSignal, CompatibilitySubScoresV1 } from "./engine/provider-contract";

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

interface CompatibilityNarrativeInput {
  score: number;
  rawSignals?: CompatibilityRawSignal[];
  subScores?: CompatibilitySubScoresV1;
  basis?: CompatibilityBasisV1;
  confidence?: { level?: CompatibilityConfidenceLevel; reasons?: string[] };
}

interface CompatibilityEvidenceSummary {
  hasBasis: boolean;
  hasRawSignals: boolean;
  confidence: CompatibilityConfidenceLevel;
  branchDelta: number;
  stemDelta: number;
  elementDelta: number;
  dayMasterDelta: number;
  reliabilityDelta: number;
}

function pick<T>(seed: number, list: readonly T[]): T {
  return list[Math.abs(seed) % list.length];
}

function clampRange(value: number, min = 40, max = 98) {
  return Math.max(min, Math.min(max, value));
}

function scoreBand(score: number): "low" | "mid" | "high" {
  if (score < 60) return "low";
  if (score < 80) return "mid";
  return "high";
}

function summarizeEvidence(input: CompatibilityNarrativeInput): CompatibilityEvidenceSummary {
  const sub = input.subScores;
  const raw = input.rawSignals ?? [];
  const basis = input.basis;

  const categorySum = (category: CompatibilityRawSignal["category"]) =>
    raw.filter((s) => s.category === category).reduce((acc, s) => acc + (s.weight ?? 0), 0);

  return {
    hasBasis: !!basis,
    hasRawSignals: raw.length > 0,
    confidence: input.confidence?.level ?? basis?.reliability?.confidence ?? "low",
    branchDelta: sub?.branch ?? categorySum("relation-branch"),
    stemDelta: sub?.stem ?? categorySum("relation-stem"),
    elementDelta: sub?.elements ?? categorySum("element-dynamics"),
    dayMasterDelta: sub?.dayMaster ?? categorySum("daymaster-dynamics"),
    reliabilityDelta: sub?.reliability ?? categorySum("reliability"),
  };
}

export function buildCompatibilityNarratives(input: CompatibilityNarrativeInput) {
  const evidence = summarizeEvidence(input);

  const talk = clampRange(input.score + evidence.stemDelta + Math.round(evidence.branchDelta * 0.5));
  const emotion = clampRange(input.score + evidence.dayMasterDelta + Math.round(evidence.reliabilityDelta * 0.4));
  const lifestyle = clampRange(input.score + evidence.elementDelta + evidence.branchDelta + Math.round(evidence.reliabilityDelta * 0.3));
  const seed = input.score + (evidence.branchDelta * 3) + (evidence.stemDelta * 5) + (evidence.elementDelta * 7) + (evidence.dayMasterDelta * 11) + (evidence.reliabilityDelta * 13);
  const band = scoreBand(input.score);

  const sourceLine = evidence.hasBasis
    ? pick(seed + 1, [
        `basis 기반으로 해석했어요. (신뢰도 ${evidence.confidence})`,
        `실신호(basis)를 우선 반영한 결과예요. (신뢰도 ${evidence.confidence})`,
        `근거 신호(basis/subscore) 중심으로 분석했어요. (신뢰도 ${evidence.confidence})`,
      ])
    : evidence.hasRawSignals
      ? pick(seed + 2, [
          "신호 기반 해석을 우선 반영했어요.",
          "raw signal 중심으로 점수를 해석했어요.",
          "신호 가중치 기반으로 현재 궁합 흐름을 읽었어요.",
        ])
      : pick(seed + 3, [
          "신호가 제한적이라 점수 기반 기본 해석을 사용했어요.",
          "데이터가 제한되어 보수적 해석을 사용했어요.",
          "근거 신호가 적어 기본 템플릿 해석으로 안내해요.",
        ]);

  const scoreLine = band === "high"
    ? pick(seed + 4, [
        `세부 점수: 대화 ${talk} / 감정 ${emotion} / 생활 ${lifestyle}`,
        `강한 연결 구간 · 대화 ${talk} · 감정 ${emotion} · 생활 ${lifestyle}`,
        `상위 밴드 결과 · 대화 ${talk} 감정 ${emotion} 생활 ${lifestyle}`,
      ])
    : band === "mid"
      ? pick(seed + 5, [
          `균형 밴드 · 대화 ${talk} · 감정 ${emotion} · 생활 ${lifestyle}`,
          `세부 점수: 대화 ${talk} / 감정 ${emotion} / 생활 ${lifestyle}`,
          `중간 밴드 결과 · 대화 ${talk} 감정 ${emotion} 생활 ${lifestyle}`,
        ])
      : pick(seed + 6, [
          `조율 필요 밴드 · 대화 ${talk} · 감정 ${emotion} · 생활 ${lifestyle}`,
          `재정렬 권장 · 대화 ${talk} / 감정 ${emotion} / 생활 ${lifestyle}`,
          `낮은 밴드 결과 · 대화 ${talk} 감정 ${emotion} 생활 ${lifestyle}`,
        ]);

  const explain = [sourceLine, scoreLine];

  const talkConflict = evidence.stemDelta < 0
    ? pick(seed + 7, [
        "대화 기준이 어긋날 수 있어요. 결론 전에 합의 조건을 먼저 맞추세요.",
        "말의 해석 차이가 생기기 쉬워요. 핵심 용어부터 먼저 맞춰보세요.",
        "즉답보다 확인 질문을 먼저 두면 갈등을 줄일 수 있어요.",
        "서로 같은 단어를 다르게 이해할 수 있어, 정의부터 맞추는 게 좋아요.",
      ])
    : pick(seed + 8, [
        "합의 속도는 좋은 편이에요. 결론 직전에 감정 확인을 한 번 넣으세요.",
        "의사결정 템포가 잘 맞아요. 마지막 체크만 넣으면 더 안정적이에요.",
        "대화 리듬이 비슷해 결론 도달이 빠른 편이에요.",
        "핵심 합의가 잘 되는 조합이라 실행 단계까지 이어지기 좋아요.",
      ]);

  const lifestyleConflict = evidence.reliabilityDelta <= -4
    ? pick(seed + 9, [
        "시간 정보가 제한되어 큰 흐름 중심 해석이 안전해요.",
        "신뢰도 보정이 들어간 결과라, 중요한 판단은 재확인해 주세요.",
        "시간 미상 보정치가 있어 확정 판단보다는 가이드로 활용해 주세요.",
      ])
    : evidence.elementDelta < 0
      ? pick(seed + 10, [
          "생활 리듬이 엇갈릴 수 있어요. 연락 주기와 일정 규칙을 먼저 정하세요.",
          "생활 패턴 충돌 신호가 있어 루틴 합의가 중요해요.",
          "일상 템포 차이를 조정하면 관계 마찰이 크게 줄어요.",
          "일정 우선순위 충돌을 미리 합의하면 피로를 줄일 수 있어요.",
        ])
      : pick(seed + 11, [
          "생활 합은 무난해요. 역할 분담을 선명히 하면 마찰이 줄어요.",
          "일상 운영은 안정적인 편이에요. 책임 구분만 미리 정해두세요.",
          "생활 리듬 호환성이 좋아 장기 운영에 유리해요.",
          "루틴 충돌이 적어 관계 에너지를 오래 유지하기 좋은 조합이에요.",
        ]);

  const tips = [
    evidence.dayMasterDelta < 0
      ? pick(seed + 12, [
          "감정이 오를 때는 사실-해석-요청 순서로 짧게 말하세요.",
          "감정 대화는 타이밍을 늦추고 핵심만 짧게 정리해보세요.",
          "갈등 시 10분 쿨다운 후 재대화하면 회복이 빨라져요.",
          "감정 피크 구간에는 결론보다 공감 확인을 먼저 두세요.",
        ])
      : pick(seed + 13, [
          "잘 맞았던 대화 패턴을 반복하면 관계 품질이 안정돼요.",
          "긍정적으로 작동한 소통 방식은 주기적으로 재사용하세요.",
          "강점 신호가 있는 루틴을 반복하면 만족도가 올라가요.",
          "잘 맞는 약속 템플릿을 고정하면 갈등 확률이 줄어들어요.",
        ]),
    evidence.confidence === "low"
      ? pick(seed + 14, [
          "중요 결정은 하루 텀을 두고 한 번 더 확인하세요.",
          "신뢰도 낮음 구간에서는 결론을 서두르지 않는 게 좋아요.",
          "데이터 보정 구간에서는 두세 번 관찰 후 결론 내리세요.",
        ])
      : pick(seed + 15, [
          "주 1회 리듬 점검 대화를 하면 작은 오해를 줄일 수 있어요.",
          "주간 체크인 대화를 정해두면 관계 안정감이 올라가요.",
          "짧은 피드백 루틴만 있어도 충돌을 빠르게 줄일 수 있어요.",
          "정기 대화 슬롯을 만들어두면 관계 품질이 꾸준히 유지돼요.",
        ]),
  ];

  const conflict = [talkConflict, lifestyleConflict];

  return { talk, emotion, lifestyle, explain, conflict, tips, evidence };
}
