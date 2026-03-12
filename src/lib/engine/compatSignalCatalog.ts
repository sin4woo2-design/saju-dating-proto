export const compatSignalCatalog = {
  BRANCH_HAP_YEAR: {
    label: "연지 합",
    desc: "기본 성향과 생활 감각이 잘 맞아 초반 친밀도가 빨라요.",
  },
  BRANCH_CHUNG_YEAR: {
    label: "연지 충",
    desc: "생활 리듬이 달라 사소한 습관에서 충돌이 날 수 있어요.",
  },
  BRANCH_HYEONG_YEAR: {
    label: "연지 형",
    desc: "관계 긴장 포인트가 누적되기 쉬워 조율이 필요해요.",
  },
  BRANCH_PA_YEAR: {
    label: "연지 파",
    desc: "작은 생활 습관 차이가 반복되면 피로가 쌓일 수 있어요.",
  },
  BRANCH_HAE_YEAR: {
    label: "연지 해",
    desc: "오해가 생기기 쉬운 구간이라 확인 대화가 중요해요.",
  },
  BRANCH_BALANCED: {
    label: "연지 중립",
    desc: "큰 충돌 없이 기본 밸런스가 유지되는 구간이에요.",
  },
  STEM_HAP_DAY: {
    label: "일간 합",
    desc: "서로의 핵심 성향이 맞물려 감정 교류가 자연스러워요.",
  },
  STEM_CHUNG_DAY: {
    label: "일간 충",
    desc: "중요한 가치관에서 방향이 달라 논쟁이 커질 수 있어요.",
  },
  ELEMENT_GENERATES_MUTUAL: {
    label: "오행 상생",
    desc: "강점이 서로를 북돋우는 흐름이라 회복력이 좋은 편이에요.",
  },
  DAYMASTER_SUPPORT_MUTUAL: {
    label: "일간 보완",
    desc: "서로의 부족한 부분을 메워주는 안정형 궁합 신호예요.",
  },
  ELEMENT_CONTROLS_IMBALANCED: {
    label: "오행 상극",
    desc: "주도권/표현 방식 차이로 피로감이 누적될 수 있어요.",
  },
  DAYMASTER_CLASH: {
    label: "일간 충돌",
    desc: "해석 방식이 달라 같은 사건도 다르게 받아들일 수 있어요.",
  },
  RELIABILITY_TIME_UNKNOWN_ME: {
    label: "내 시간 미상",
    desc: "내 출생시간이 없어 일부 신호 정확도가 낮아져요.",
  },
  RELIABILITY_TIME_UNKNOWN_PARTNER: {
    label: "상대 시간 미상",
    desc: "상대 출생시간 정보 부족으로 세부 해석이 축약됐어요.",
  },
  RELIABILITY_PARTIAL_PILLARS: {
    label: "부분 기둥",
    desc: "일부 기둥 정보가 제한되어 핵심 흐름 중심으로 계산됐어요.",
  },
} as const;

export function getCompatSignalMeta(code: string) {
  return compatSignalCatalog[code as keyof typeof compatSignalCatalog];
}

export function isKnownCompatSignal(code: string) {
  return !!getCompatSignalMeta(code);
}
