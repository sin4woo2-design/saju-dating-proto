#!/usr/bin/env node

function pick(seed, list) {
  return list[Math.abs(seed) % list.length];
}

function tokenize(text) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9가-힣\s|:-]/g, " ")
    .split(/\s+/)
    .filter(Boolean);
}

function jaccard(a, b) {
  const sa = new Set(tokenize(a));
  const sb = new Set(tokenize(b));
  const inter = [...sa].filter((x) => sb.has(x)).length;
  const union = new Set([...sa, ...sb]).size;
  return union === 0 ? 0 : inter / union;
}

function exactRate(rows) {
  const total = rows.length;
  const unique = new Set(rows).size;
  return { total, unique, duplicateRate: Number(((1 - unique / total) * 100).toFixed(1)) };
}

function nearDuplicateRate(rows, threshold = 0.97) {
  let near = 0;
  let pairs = 0;
  const maxN = Math.min(rows.length, 240);
  for (let i = 0; i < maxN; i += 1) {
    for (let j = i + 1; j < maxN; j += 1) {
      pairs += 1;
      if (jaccard(rows[i], rows[j]) >= threshold) near += 1;
    }
  }
  return {
    comparedPairs: pairs,
    nearPairs: near,
    nearDuplicateRate: Number(((near / Math.max(1, pairs)) * 100).toFixed(1)),
    threshold,
  };
}

const states = ["provider", "mock-fallback", "mock"];

function homeRow({ seed, state, basisMode = "vary", rotationMode = "vary" }) {
  const tones = ["soft", "clear"];
  const flows = ["afternoon-peak", "steady-day"];
  const focuses = ["morning-setup", "afternoon-focus", "evening-wrap"];
  const elements = ["wood", "fire", "earth", "metal", "water"];

  const tone = basisMode === "fixed" ? "soft" : tones[seed % 2];
  const flow = basisMode === "fixed" ? "steady-day" : flows[(seed + 1) % 2];
  const focus = basisMode === "fixed" ? "afternoon-focus" : focuses[(seed + 2) % 3];
  const dominant = basisMode === "fixed" ? "earth" : elements[(seed + 3) % 5];

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
  const rot = rotationMode === "fixed" ? 0 : seed % 13;
  const rotationTail = pick(rot, ["", " (톤 변주)", " (표현 변주)"]);

  const basisKey = `basis:${tone}-${flow}-${focus}-${dominant}`;
  return `${intro}|${pick(seed + 3, bridgeByElement[dominant])}${rotationTail}|${close}|${tf}|${stateLine}|${basisKey}`;
}

function personaRow({ seed, state, basisMode = "vary", rotationMode = "vary" }) {
  const tones = ["warm", "calm"];
  const styles = ["strategist", "mediator"];
  const axes = ["emotion-sync", "rhythm-sync", "trust-build"];
  const elements = ["wood", "fire", "earth", "metal", "water"];

  const tone = basisMode === "fixed" ? "warm" : tones[seed % 2];
  const style = basisMode === "fixed" ? "strategist" : styles[(seed + 1) % 2];
  const axis = basisMode === "fixed" ? "trust-build" : axes[(seed + 2) % 3];
  const dominant = basisMode === "fixed" ? "earth" : elements[(seed + 3) % 5];

  const title = pick(seed + 1, [`${tone}-${style}-${axis}-${dominant}-A`, `${tone}-${style}-${axis}-${dominant}-B`, `${tone}-${style}-${axis}-${dominant}-C`, `${tone}-${style}-${axis}-${dominant}-D`]);
  const subtitle = [pick(seed + 7, [`${axis}-1`, `${axis}-2`, `${axis}-3`]), pick(seed + 9, [`${dominant}-n1`, `${dominant}-n2`, `${dominant}-n3`]), pick(seed + 11, [`${style}-k1`, `${style}-k2`, `${style}-k3`])].join("-");
  const traits = [pick(seed + 13, [`age-${tone}-1`, `age-${tone}-2`, `age-${tone}-3`]), pick(seed + 15, [`person-${style}-1`, `person-${style}-2`, `person-${style}-3`]), pick(seed + 17, [`career-${dominant}-1`, `career-${dominant}-2`, `career-${dominant}-3`]), pick(seed + 19, [`look-${axis}-1`, `look-${axis}-2`, `look-${axis}-3`])].join("|");

  const stateLine = state === "provider" ? "실신호 반영" : state === "mock-fallback" ? "부분 보정" : "기본 해석";
  const rot = rotationMode === "fixed" ? 0 : seed % 17;
  const rotationTail = pick(rot, ["", " (톤 변주)", " (어휘 변주)"]);

  const basisKey = `basis:${tone}-${style}-${axis}-${dominant}`;
  return `${title}|${subtitle}${rotationTail}|${traits}|${stateLine}|${basisKey}`;
}

function sampleRows(domain, state, opts = {}, n = 360) {
  const rows = [];
  for (let seed = 1; seed <= n; seed += 1) {
    rows.push(domain === "home" ? homeRow({ seed, state, ...opts }) : personaRow({ seed, state, ...opts }));
  }
  return rows;
}

function determinismRate(domain, state) {
  // same input, same state, fixed basis+rotation should be deterministic
  const fixedA = sampleRows(domain, state, { basisMode: "fixed", rotationMode: "fixed" }, 100);
  const fixedB = sampleRows(domain, state, { basisMode: "fixed", rotationMode: "fixed" }, 100);

  let same = 0;
  for (let i = 0; i < fixedA.length; i += 1) {
    if (fixedA[i] === fixedB[i]) same += 1;
  }
  return Number(((same / fixedA.length) * 100).toFixed(1));
}

function impactSplit(domain, state) {
  const baseline = sampleRows(domain, state, { basisMode: "fixed", rotationMode: "fixed" }, 360);
  const nonceOnly = sampleRows(domain, state, { basisMode: "fixed", rotationMode: "vary" }, 360);
  const basisOnly = sampleRows(domain, state, { basisMode: "vary", rotationMode: "fixed" }, 360);

  return {
    baselineUnique: new Set(baseline).size,
    nonceOnlyUnique: new Set(nonceOnly).size,
    basisOnlyUnique: new Set(basisOnly).size,
  };
}

function auditDomain(domain) {
  const split = {};
  for (const state of states) {
    const rows = sampleRows(domain, state);
    split[state] = {
      exact: exactRate(rows),
      near: nearDuplicateRate(rows),
      determinismRate: determinismRate(domain, state),
      impact: impactSplit(domain, state),
    };
  }

  const merged = states.flatMap((s) => sampleRows(domain, s));
  return {
    exact: exactRate(merged),
    near: nearDuplicateRate(merged),
    split,
  };
}

const report = {
  generatedAt: new Date().toISOString(),
  home: auditDomain("home"),
  persona: auditDomain("persona"),
};

console.log(JSON.stringify(report, null, 2));
