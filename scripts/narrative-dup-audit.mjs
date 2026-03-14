#!/usr/bin/env node

function pick(seed, list) {
  return list[Math.abs(seed) % list.length];
}

function summarize(lines) {
  const total = lines.length;
  const unique = new Set(lines).size;
  const duplicateRate = Number(((1 - unique / total) * 100).toFixed(1));
  return { total, unique, duplicateRate };
}

const states = ["provider", "mock-fallback", "mock"];

function homeSample(state, n = 360) {
  const tones = ["soft", "clear"];
  const flows = ["afternoon-peak", "steady-day"];
  const focuses = ["morning-setup", "afternoon-focus", "evening-wrap"];
  const elements = ["wood", "fire", "earth", "metal", "water"];

  const rows = [];
  for (let seed = 1; seed <= n; seed++) {
    const tone = tones[seed % 2];
    const flow = flows[(seed + 1) % 2];
    const focus = focuses[(seed + 2) % 3];
    const dominant = elements[(seed + 3) % 5];

    const intro = tone === "soft"
      ? pick(seed + 1, ["핵심 대화는 오늘 짧게 시작하세요.", "중요한 말은 첫 문장을 가볍게 여세요.", "질문형 첫 문장이 흐름을 부드럽게 열어요."])
      : pick(seed + 1, ["큰 결정보다 현재 조율이 먼저예요.", "핵심을 한 문장으로 먼저 제시해보세요.", "결론보다 우선순위를 먼저 맞추세요."]);

    const bridgeByElement = {
      wood: ["성장형 과제가 잘 맞아요.", "학습형 작업에서 강점이 살아나요.", "확장형 기획이 유리해요."],
      fire: ["표현력이 좋아 반응이 빨라요.", "대화 임팩트가 선명해요.", "설득 구간이 강해요."],
      earth: ["정리/관리 완성도가 높아요.", "루틴을 고정하면 안정적이에요.", "실무 운영력이 좋아요."],
      metal: ["기준 정리가 성과를 올려줘요.", "우선순위 재정렬이 잘 돼요.", "결정 프레임이 선명해요."],
      water: ["공감/관찰력이 좋아요.", "깊은 대화가 유리해요.", "맥락 해석이 잘 돼요."],
    };

    const close = flow === "afternoon-peak"
      ? pick(seed + 5, ["오후 블록에 핵심을 배치하세요.", "오후 집중 구간을 활용하세요.", "중요 미팅은 오후가 유리해요."])
      : pick(seed + 5, ["저녁 전 정리로 피로를 줄이세요.", "마감 체크를 짧게 넣어보세요.", "하루 끝 체크가 리듬을 살려줘요."]);

    const tf = focus === "morning-setup"
      ? pick(seed + 7, ["오전: 계획 확정", "오전: 우선순위 정리", "오전: 루틴 점검"])
      : focus === "afternoon-focus"
        ? pick(seed + 7, ["오후: 결론 정리", "오후: 핵심 실행", "오후: 성과 작업"])
        : pick(seed + 7, ["저녁: 관계 조율", "저녁: 회복 루틴", "저녁: 정리 마감"]);

    const stateLine = state === "provider" ? "실신호 반영" : state === "mock-fallback" ? "부분 보정" : "기본 해석";

    rows.push(`${intro}|${pick(seed + 3, bridgeByElement[dominant])}|${close}|${tf}|${stateLine}|r${seed % 13}`);
  }
  return rows;
}

function personaSample(state, n = 360) {
  const tones = ["warm", "calm"];
  const styles = ["strategist", "mediator"];
  const axes = ["emotion-sync", "rhythm-sync", "trust-build"];
  const elements = ["wood", "fire", "earth", "metal", "water"];

  const rows = [];
  for (let seed = 1; seed <= n; seed++) {
    const tone = tones[seed % 2];
    const style = styles[(seed + 1) % 2];
    const axis = axes[(seed + 2) % 3];
    const dominant = elements[(seed + 3) % 5];

    const title = pick(seed + 1, [
      `${tone}-${style}-${axis}-${dominant}-A`,
      `${tone}-${style}-${axis}-${dominant}-B`,
      `${tone}-${style}-${axis}-${dominant}-C`,
      `${tone}-${style}-${axis}-${dominant}-D`,
    ]);

    const subtitle = [
      pick(seed + 7, [`${axis}-1`, `${axis}-2`, `${axis}-3`]),
      pick(seed + 9, [`${dominant}-n1`, `${dominant}-n2`, `${dominant}-n3`]),
      pick(seed + 11, [`${style}-k1`, `${style}-k2`, `${style}-k3`]),
    ].join("-");

    const traits = [
      pick(seed + 13, [`age-${tone}-1`, `age-${tone}-2`, `age-${tone}-3`]),
      pick(seed + 15, [`person-${style}-1`, `person-${style}-2`, `person-${style}-3`]),
      pick(seed + 17, [`career-${dominant}-1`, `career-${dominant}-2`, `career-${dominant}-3`]),
      pick(seed + 19, [`look-${axis}-1`, `look-${axis}-2`, `look-${axis}-3`]),
    ].join("|");

    const stateLine = state === "provider" ? "실신호 반영" : state === "mock-fallback" ? "부분 보정" : "기본 해석";
    rows.push(`${title}|${subtitle}|${traits}|${stateLine}|r${seed % 17}`);
  }
  return rows;
}

function byState(name, sampler) {
  const split = Object.fromEntries(states.map((s) => [s, summarize(sampler(s))]));
  const all = summarize(states.flatMap((s) => sampler(s)));
  return { name, all, split };
}

const home = byState("home", homeSample);
const persona = byState("persona", personaSample);

const report = {
  generatedAt: new Date().toISOString(),
  home,
  persona,
};

console.log(JSON.stringify(report, null, 2));
