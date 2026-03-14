#!/usr/bin/env node

/**
 * Lightweight copy diversity audit for Home/Persona/Compatibility narrative branches.
 * 목적: VOC 재발 방지를 위한 중복률(고유율) 빠른 점검.
 */

function pick(seed, list) {
  return list[Math.abs(seed) % list.length];
}

function auditHome() {
  const tones = ["soft", "clear"];
  const flows = ["afternoon-peak", "steady-day"];
  const focuses = ["morning-setup", "afternoon-focus", "evening-wrap"];
  const elements = ["wood", "fire", "earth", "metal", "water"];

  const lines = [];

  for (let seed = 1; seed <= 120; seed++) {
    const tone = tones[seed % tones.length];
    const flow = flows[(seed + 1) % flows.length];
    const focus = focuses[(seed + 2) % focuses.length];
    const dominant = elements[(seed + 3) % elements.length];
    const support = elements[(seed + 4) % elements.length];

    const pool = tone === "soft"
      ? {
          line1: ["핵심 대화는 오늘 짧게 시작하세요.", "중요한 말은 첫 문장을 가볍게 여세요."],
          line2: ["속도보다 톤을 맞추면 흐름이 안정돼요.", "답을 급히 내지 않으면 반응이 좋아요."],
          line3: ["일정 우선순위만 잡아도 하루가 단단해져요.", "작은 정리 하나가 저녁 피로를 줄여줘요."],
        }
      : {
          line1: ["큰 결정보다 현재 조율이 먼저예요.", "핵심을 한 문장으로 먼저 제시해보세요."],
          line2: ["관계는 말의 길이보다 순서가 중요해요.", "즉답보다 확인 한 번이 안전해요."],
          line3: ["오후 집중 시간에 결론을 모으세요.", "중요 작업은 한 번에 하나씩 묶어 처리하세요."],
        };

    const convPool = tone === "soft"
      ? ["질문을 먼저 두면 대화가 부드러워져요.", "공감 한 문장을 먼저 두면 반응이 열려요.", "결론보다 맥락을 먼저 확인하면 갈등이 줄어요."]
      : ["핵심을 한 문장으로 먼저 꺼내세요.", "요청-근거-기한 순서로 말하면 오해가 줄어요.", "결정 포인트를 먼저 합의하면 대화가 빨라져요."];

    const wealthMap = {
      wood: ["학습/도구 지출은 효율부터 비교해보세요.", "확장성 있는 지출만 남기면 흐름이 좋아져요."],
      fire: ["충동 결제는 오후 이후 한 번 더 확인하세요.", "작은 소비는 예산 한도를 먼저 정해두세요."],
      earth: ["고정 지출만 점검해도 흐름이 안정돼요.", "생활비 카테고리 재정렬만 해도 누수가 줄어요."],
      metal: ["정기결제 정리로 이번 주 현금흐름이 개선돼요.", "우선순위 낮은 결제는 오늘 정리해두세요."],
      water: ["정보성 소비는 메모 후 하루 뒤 결제하세요.", "감정성 지출은 시간 간격을 두면 정확해져요."],
    };

    const cautionPool = support === "water"
      ? ["감정 반응은 한 템포 늦추는 편이 좋아요.", "늦은 시간 감정 대화는 길어지기 쉬워요."]
      : ["약속 시간 겹침만 먼저 막아두세요.", "일정 충돌을 먼저 지우면 스트레스가 줄어요."];

    const morningPool = focus === "morning-setup"
      ? ["루틴 정리와 일정 확인에 집중하세요.", "오전은 계획 확정/우선순위 정리에 최적이에요."]
      : ["오전엔 준비 속도를 올리는 게 좋아요.", "작은 할 일을 먼저 끝내면 오후가 가벼워져요."];

    const afternoonPool = flow === "afternoon-peak"
      ? ["핵심 업무와 결정은 오후에 배치하세요.", "중요한 미팅은 오후 블록에 넣는 게 좋아요."]
      : ["중요 대화는 이 시간대가 가장 안정돼요.", "리뷰/피드백 성격 작업에 적합한 흐름이에요."];

    const eveningPool = focus === "evening-wrap"
      ? ["관계 대화와 하루 정리에 맞는 시간이에요.", "감정 정리/회복 루틴을 짧게 넣어보세요."]
      : ["저녁엔 내일 준비를 가볍게 끝내세요.", "마무리 체크리스트 3개만 정리하면 좋아요."];

    const summary = [
      pick(seed + 1, pool.line1),
      pick(seed + 3, pool.line2),
      pick(seed + 5, pool.line3),
    ].join(" | ");

    const points = [
      pick(seed + 7, convPool),
      pick(seed + 11, wealthMap[dominant]),
      pick(seed + 13, cautionPool),
    ].join(" | ");

    const timeFlow = [pick(seed + 17, morningPool), pick(seed + 19, afternoonPool), pick(seed + 23, eveningPool)].join(" | ");

    lines.push(`${summary} || ${points} || ${timeFlow}`);
  }

  return lines;
}

function auditPersona() {
  const tones = ["warm", "calm"];
  const styles = ["strategist", "mediator"];
  const axes = ["emotion-sync", "rhythm-sync", "trust-build"];
  const elements = ["wood", "fire", "earth", "metal", "water"];

  const rows = [];
  for (let seed = 1; seed <= 120; seed++) {
    const tone = tones[seed % tones.length];
    const style = styles[(seed + 1) % styles.length];
    const axis = axes[(seed + 2) % axes.length];
    const dominant = elements[(seed + 3) % elements.length];

    const title = `${tone}-${style}-${axis}-${dominant}-${seed % 2}`;
    const subtitle = `${axis}-${seed % 3}`;
    const traits = `${tone}-${style}-${seed % 3}-${seed % 2}`;
    const appeal = `${axis}-${seed % 3}`;

    rows.push(`${title} | ${subtitle} | ${traits} | ${appeal}`);
  }
  return rows;
}

function auditCompatibility() {
  const rows = [];
  for (let score = 40; score <= 96; score += 2) {
    for (const stem of [-4, 0, 4]) {
      for (const elem of [-3, 0, 3]) {
        for (const rel of [-4, 0]) {
          const seed = score + stem * 5 + elem * 7 + rel * 13;
          const explain = pick(seed + 1, [
            `basis 기반으로 해석했어요.`,
            `실신호(basis)를 우선 반영한 결과예요.`,
          ]);
          const conflict = pick(seed + 5, [
            "대화 기준이 어긋날 수 있어요.",
            "말의 해석 차이가 생기기 쉬워요.",
            "즉답보다 확인 질문이 좋아요.",
          ]);
          const tip = pick(seed + 10, [
            "감정 대화는 짧게 정리하세요.",
            "잘 맞는 패턴을 반복하세요.",
            "주간 체크인을 유지하세요.",
          ]);
          rows.push(`${explain} | ${conflict} | ${tip}`);
        }
      }
    }
  }
  return rows;
}

function summarize(name, lines) {
  const total = lines.length;
  const unique = new Set(lines).size;
  const duplicateRate = ((1 - unique / total) * 100).toFixed(1);
  return { name, total, unique, duplicateRate };
}

const home = summarize("home", auditHome());
const persona = summarize("persona", auditPersona());
const compat = summarize("compatibility", auditCompatibility());

const report = `# Copy Diversity Audit Report\n\nGenerated: ${new Date().toISOString()}\n\n## Summary\n- home: total ${home.total}, unique ${home.unique}, duplicate-rate ${home.duplicateRate}%\n- persona: total ${persona.total}, unique ${persona.unique}, duplicate-rate ${persona.duplicateRate}%\n- compatibility: total ${compat.total}, unique ${compat.unique}, duplicate-rate ${compat.duplicateRate}%\n\n## Gate (advisory)\n- target duplicate-rate: <= 35%\n- home: ${Number(home.duplicateRate) <= 35 ? "PASS" : "WARN"}\n- persona: ${Number(persona.duplicateRate) <= 35 ? "PASS" : "WARN"}\n- compatibility: ${Number(compat.duplicateRate) <= 35 ? "PASS" : "WARN"}\n`;

console.log(report);
