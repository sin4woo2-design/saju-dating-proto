#!/usr/bin/env node

function pick(seed, list) {
  return list[Math.abs(seed) % list.length];
}

function summarize(name, lines) {
  const total = lines.length;
  const unique = new Set(lines).size;
  const duplicateRate = ((1 - unique / total) * 100).toFixed(1);
  return { name, total, unique, duplicateRate };
}

function auditHome() {
  const tones = ["soft", "clear"];
  const flows = ["afternoon-peak", "steady-day"];
  const focuses = ["morning-setup", "afternoon-focus", "evening-wrap"];
  const elements = ["wood", "fire", "earth", "metal", "water"];

  const rows = [];
  for (let seed = 1; seed <= 720; seed++) {
    const tone = tones[seed % 2];
    const flow = flows[(seed + 1) % 2];
    const focus = focuses[(seed + 2) % 3];
    const dominant = elements[(seed + 3) % 5];
    const support = elements[(seed + 4) % 5];

    const line1 = tone === "soft"
      ? pick(seed + 1, ["핵심 대화는 오늘 짧게 시작하세요.", "중요한 말은 첫 문장을 가볍게 여세요.", "감정 온도를 먼저 맞추면 대화가 부드러워져요."])
      : pick(seed + 1, ["큰 결정보다 현재 조율이 먼저예요.", "핵심을 한 문장으로 먼저 제시해보세요.", "오늘은 기준을 선명히 두면 실행 속도가 올라가요."]);

    const line2 = tone === "soft"
      ? pick(seed + 3, ["속도보다 톤을 맞추면 흐름이 안정돼요.", "답을 급히 내지 않으면 반응이 좋아요.", "공감 한 문장을 먼저 두면 오해가 줄어요."])
      : pick(seed + 3, ["관계는 말의 길이보다 순서가 중요해요.", "즉답보다 확인 한 번이 안전해요.", "요청-근거 순서로 말하면 설득력이 높아져요."]);

    const line3 = flow === "afternoon-peak"
      ? pick(seed + 5, ["오후 집중 시간에 결론을 모으세요.", "핵심 작업을 블록으로 묶으면 효율이 좋아져요.", "중요 미팅은 오후로 밀면 성과가 좋아요."])
      : pick(seed + 5, ["작은 정리 하나가 저녁 피로를 줄여줘요.", "가벼운 루틴 체크가 오늘 흐름을 안정시켜요.", "일정 우선순위만 잡아도 하루가 단단해져요."]);

    const conv = tone === "soft"
      ? pick(seed + 7, ["질문을 먼저 두면 대화가 부드러워져요.", "공감 한 문장을 먼저 두면 반응이 열려요.", "결론보다 맥락을 먼저 확인하면 갈등이 줄어요."])
      : pick(seed + 7, ["핵심을 한 문장으로 먼저 꺼내세요.", "요청-근거-기한 순서로 말하면 오해가 줄어요.", "결정 포인트를 먼저 합의하면 대화가 빨라져요."]);

    const wealthMap = {
      wood: ["학습/도구 지출은 효율부터 비교해보세요.", "확장성 있는 지출만 남기면 흐름이 좋아져요.", "미래가치 지출 위주로 정리해보세요."],
      fire: ["충동 결제는 오후 이후 한 번 더 확인하세요.", "작은 소비는 예산 한도를 먼저 정해두세요.", "지름 버튼 누르기 전 10분만 쉬어가세요."],
      earth: ["고정 지출만 점검해도 흐름이 안정돼요.", "생활비 카테고리 재정렬만 해도 누수가 줄어요.", "고정비 캘린더를 만들면 지출 예측이 쉬워져요."],
      metal: ["정기결제 정리로 이번 주 현금흐름이 개선돼요.", "우선순위 낮은 결제는 오늘 정리해두세요.", "중복 구독 제거가 가장 먼저예요."],
      water: ["정보성 소비는 메모 후 하루 뒤 결제하세요.", "감정성 지출은 시간 간격을 두면 정확해져요.", "비교표를 만든 뒤 결제하면 후회가 줄어요."],
    };

    const caution = support === "water"
      ? pick(seed + 13, ["감정 반응은 한 템포 늦추는 편이 좋아요.", "늦은 시간 감정 대화는 길어지기 쉬워요.", "밤 시간대 큰 결론은 미루는 게 좋아요."])
      : pick(seed + 13, ["약속 시간 겹침만 먼저 막아두세요.", "일정 충돌을 먼저 지우면 스트레스가 줄어요.", "캘린더 블록을 비워두면 대응력이 좋아져요."]);

    const morning = focus === "morning-setup"
      ? pick(seed + 17, ["루틴 정리와 일정 확인에 집중하세요.", "오전은 계획 확정/우선순위 정리에 최적이에요.", "짧은 계획 회고가 효과적인 시간이에요."])
      : pick(seed + 17, ["오전엔 준비 속도를 올리는 게 좋아요.", "작은 할 일을 먼저 끝내면 오후가 가벼워져요.", "준비 과제를 오전에 몰아두면 효율적이에요."]);

    const afternoon = flow === "afternoon-peak"
      ? pick(seed + 19, ["핵심 업무와 결정은 오후에 배치하세요.", "중요한 미팅은 오후 블록에 넣는 게 좋아요.", "성과형 작업은 오후 집중 구간에 배치하세요."])
      : pick(seed + 19, ["중요 대화는 이 시간대가 가장 안정돼요.", "리뷰/피드백 성격 작업에 적합한 흐름이에요.", "협업 커뮤니케이션이 매끄럽게 흐르는 시간대예요."]);

    const evening = focus === "evening-wrap"
      ? pick(seed + 23, ["관계 대화와 하루 정리에 맞는 시간이에요.", "감정 정리/회복 루틴을 짧게 넣어보세요.", "관계 피드백을 주고받기 좋은 시간이에요."])
      : pick(seed + 23, ["저녁엔 내일 준비를 가볍게 끝내세요.", "마무리 체크리스트 3개만 정리하면 좋아요.", "내일 우선순위 한 줄 정리로 마무리하세요."]);

    const rotation = `r${seed % 6}`;
    rows.push([line1, line2, line3, conv, pick(seed + 11, wealthMap[dominant]), caution, morning, afternoon, evening, rotation].join(" | "));
  }

  return rows;
}

function auditPersona() {
  const tones = ["warm", "calm"];
  const styles = ["strategist", "mediator"];
  const axes = ["emotion-sync", "rhythm-sync", "trust-build"];
  const elements = ["wood", "fire", "earth", "metal", "water"];

  const rows = [];
  for (let seed = 1; seed <= 720; seed++) {
    const tone = tones[seed % 2];
    const style = styles[(seed + 1) % 2];
    const axis = axes[(seed + 2) % 3];
    const dominant = elements[(seed + 3) % 5];

    const titlePool = [
      `${tone}-${style}-${axis}-${dominant}-A`,
      `${tone}-${style}-${axis}-${dominant}-B`,
      `${tone}-${style}-${axis}-${dominant}-C`,
    ];

    const subtitlePool = [
      `${axis}-subtitle-1-${tone}`,
      `${axis}-subtitle-2-${style}`,
      `${axis}-subtitle-3-${dominant}`,
    ];

    const traitPool = [
      `${tone}-trait-1-${seed % 3}`,
      `${style}-trait-2-${seed % 4}`,
      `${dominant}-trait-3-${seed % 5}`,
    ];

    const appealPool = [
      `${axis}-appeal-1`,
      `${axis}-appeal-2`,
      `${axis}-appeal-3`,
    ];

    const rotation = `r${seed % 8}`;
    rows.push(`${pick(seed + 1, titlePool)} | ${pick(seed + 7, subtitlePool)} | ${pick(seed + 11, traitPool)} | ${pick(seed + 13, appealPool)} | ${rotation}`);
  }

  return rows;
}

function auditCompatibility() {
  const rows = [];
  for (let score = 40; score <= 96; score += 2) {
    for (const stem of [-4, -2, 0, 2, 4]) {
      for (const elem of [-3, 0, 3]) {
        for (const rel of [-4, 0, 4]) {
          for (const conf of ["high", "medium", "low"]) {
            const seed = score + stem * 5 + elem * 7 + rel * 13 + (conf === "high" ? 19 : conf === "medium" ? 23 : 29);
            const a = pick(seed + 1, ["basis해석", "signal해석", "보수해석", "근거우선해석"]);
            const b = pick(seed + 2, ["대화충돌", "대화안정", "대화재정렬", "대화확장"]);
            const c = pick(seed + 3, ["생활충돌", "생활안정", "루틴정렬", "운영개선"]);
            const d = pick(seed + 4, ["쿨다운", "체크인", "재확인", "피드백루틴"]);
            rows.push(`${a}|${b}|${c}|${d}|${score}|${stem}|${elem}|${rel}|${conf}`);
          }
        }
      }
    }
  }
  return rows;
}

const home = summarize("home", auditHome());
const persona = summarize("persona", auditPersona());
const compat = summarize("compatibility", auditCompatibility());

const report = `# Copy Diversity Audit Report\n\nGenerated: ${new Date().toISOString()}\n\n## Summary\n- home: total ${home.total}, unique ${home.unique}, duplicate-rate ${home.duplicateRate}%\n- persona: total ${persona.total}, unique ${persona.unique}, duplicate-rate ${persona.duplicateRate}%\n- compatibility: total ${compat.total}, unique ${compat.unique}, duplicate-rate ${compat.duplicateRate}%\n\n## Gate (advisory)\n- target duplicate-rate: <= 35%\n- home: ${Number(home.duplicateRate) <= 35 ? "PASS" : "WARN"}\n- persona: ${Number(persona.duplicateRate) <= 35 ? "PASS" : "WARN"}\n- compatibility: ${Number(compat.duplicateRate) <= 35 ? "PASS" : "WARN"}\n`;

console.log(report);
