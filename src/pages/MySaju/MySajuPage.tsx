import { useEffect, useMemo, useState } from "react";
import ResultCard from "../../components/ResultCard/ResultCard";
import PageLayout from "../../components/layout/PageLayout";
import { elementLabels } from "../../constants/labels";
import { useTransientMessage } from "../../hooks/useTransientMessage";
import { calculateSajuResult } from "../../lib/sajuEngine";
import { buildSajuNarratives } from "../../lib/resultNarratives";
import { shareOrCopy } from "../../lib/share";
import type { SajuProfile, UserProfileInput } from "../../types/saju";
import type { SajuChartSnapshot } from "../../lib/engine/types";

interface Props {
  me: UserProfileInput;
}

function warningLabel(code: string) {
  if (code.includes("PARTIAL")) return "부분 데이터";
  if (code.includes("TIMEOUT")) return "지연 발생";
  if (code.includes("UNAVAILABLE")) return "연결 불가";
  return code;
}

function statusText(providerState: "mock" | "provider" | "mock-fallback", warnings: string[]) {
  if (providerState === "mock") {
    return {
      badge: "mock 모드",
      detail: "현재는 데모 계산 결과를 보여주고 있어요.",
      tone: "fallback",
    } as const;
  }
  if (providerState === "mock-fallback") {
    return {
      badge: "fallback 사용",
      detail: "실계산 연결이 잠시 불안정해 백업 규칙으로 안내해요.",
      tone: "fallback",
    } as const;
  }
  if (warnings.some((w) => w.includes("PARTIAL"))) {
    return {
      badge: "일부 보정됨",
      detail: "출생시간 미상/부분 데이터가 있어 해석은 참고용으로 봐주세요.",
      tone: "warn",
    } as const;
  }
  return {
    badge: "실계산 사용",
    detail: "lunar-python 계산 결과가 반영된 리포트예요.",
    tone: "ok",
  } as const;
}

function elementColor(key: string) {
  const map: Record<string, string> = {
    wood: "#64d2a8",
    fire: "#ff7b91",
    earth: "#f3c56a",
    metal: "#a6b4ff",
    water: "#67c8ff",
  };
  return map[key] ?? "#ab95ff";
}

function todayLine(strong: string, weak: string) {
  return `${elementLabels[strong]}로 힘을 내고, ${elementLabels[weak]}는 천천히 보완하는 하루가 좋아요.`;
}

function splitPillar(value?: string) {
  if (!value) return { stem: "-", branch: "-", raw: "-" };
  const trimmed = value.trim();
  if (trimmed.length >= 2) {
    return { stem: trimmed[0], branch: trimmed.slice(1), raw: trimmed };
  }
  return { stem: trimmed, branch: "-", raw: trimmed };
}

const stemGuide: Record<string, string> = {
  갑: "곧고 시작 에너지가 강한 기운이에요.",
  을: "유연하고 섬세하게 적응하는 기운이에요.",
  병: "밝고 표현력이 강한 태양형 기운이에요.",
  정: "따뜻하고 감정 밀도가 높은 기운이에요.",
  무: "중심을 잡고 버티는 안정형 기운이에요.",
  기: "배려와 조율에 강한 현실형 기운이에요.",
  경: "판단이 빠르고 기준이 분명한 기운이에요.",
  신: "정교함·디테일에 강한 기운이에요.",
  임: "흐름을 크게 보고 확장하는 기운이에요.",
  계: "깊이 있게 관찰하고 축적하는 기운이에요.",
};

const branchGuide: Record<string, string> = {
  자: "감정 흐름이 빠르고 반응성이 높은 편이에요.",
  축: "천천히 단단해지는 성향이 강해요.",
  인: "새로운 시도를 밀어붙이는 힘이 있어요.",
  묘: "관계 감수성과 조화 감각이 좋은 편이에요.",
  진: "현실 감각과 확장 욕구가 함께 있는 타입이에요.",
  사: "열정과 몰입이 빠르게 올라오는 편이에요.",
  오: "표현력과 존재감이 강하게 드러나요.",
  미: "배려와 생활 안정감을 중요하게 보는 편이에요.",
  신: "판단과 실행의 속도가 빠른 편이에요.",
  유: "기준을 정리하고 완성도를 높이는 타입이에요.",
  술: "책임감과 현실적인 판단이 강한 편이에요.",
  해: "공감력과 직관이 깊게 작동하는 편이에요.",
};

const pillarContextGuide: Record<string, string> = {
  "연주": "연주는 타고난 배경과 어린 시절 분위기를 보여줘요.",
  "월주": "월주는 사회 속 역할감, 청년기 흐름, 환경 적응력을 보여줘요.",
  "일주": "일주는 나의 핵심 성향과 관계에서의 기본 태도를 보여줘요.",
  "시주": "시주는 내면의 깊은 결, 후반 인생 흐름, 말년 분위기를 보여줘요.",
};

function guideText(type: "stem" | "branch", key: string, pillarLabel: string) {
  const context = pillarContextGuide[pillarLabel] ?? "이 기둥은 삶의 한 축을 보여주는 단서예요.";
  if (key === "-" || !key) return `${context} 현재 값은 아직 없거나 계산 중이에요.`;

  if (type === "stem") {
    const base = stemGuide[key] ?? `${key} 천간 해석은 곧 더 자세히 제공될 예정이에요.`;
    return `${context} 천간은 겉으로 드러나는 성향과 표현 방식을 읽는 단서예요. ${base}`;
  }

  const base = branchGuide[key] ?? `${key} 지지 해석은 곧 더 자세히 제공될 예정이에요.`;
  return `${context} 지지는 내면 리듬과 생활 패턴을 읽는 단서예요. ${base}`;
}

export default function MySajuPage({ me }: Props) {
  const [profile, setProfile] = useState<SajuProfile | null>(null);
  const [providerState, setProviderState] = useState<"mock" | "provider" | "mock-fallback">("mock");
  const [warnings, setWarnings] = useState<string[]>([]);
  const [chart, setChart] = useState<SajuChartSnapshot | undefined>(undefined);
  const [activeTab, setActiveTab] = useState<"pillars" | "ten-god" | "strength">("pillars");
  const [activePillarHint, setActivePillarHint] = useState<{ key: string; text: string } | null>(null);
  const { message, showMessage } = useTransientMessage();

  useEffect(() => {
    let active = true;
    calculateSajuResult(me)
      .then((result) => {
        if (!active) return;
        setProfile(result.profile);
        setProviderState(result.providerState);
        setWarnings(result.warnings ?? []);
        setChart(result.chart);
      })
      .catch(() => {
        if (active) showMessage("사주 계산에 실패했어요. 잠시 후 다시 시도해 주세요.");
      });

    return () => {
      active = false;
    };
  }, [me, showMessage]);

  const sortedElements = useMemo(() => {
    if (!profile) return [];
    return Object.entries(profile.fiveElements).sort((a, b) => b[1] - a[1]);
  }, [profile]);

  const topSummary = useMemo(() => {
    if (!sortedElements.length) return null;
    return {
      strongKey: sortedElements[0][0],
      weakKey: sortedElements[sortedElements.length - 1][0],
      strong: `${elementLabels[sortedElements[0][0]]} 강세`,
      weak: `${elementLabels[sortedElements[sortedElements.length - 1][0]]} 보완 필요`,
    };
  }, [sortedElements]);

  const state = statusText(providerState, warnings);
  const narratives = useMemo(
    () => (profile ? buildSajuNarratives(profile.fiveElements) : null),
    [profile]
  );

  const pillarRows = useMemo(
    () => [
      { label: "연주", value: splitPillar(chart?.pillars?.year) },
      { label: "월주", value: splitPillar(chart?.pillars?.month) },
      { label: "일주", value: splitPillar(chart?.pillars?.day) },
      { label: "시주", value: splitPillar(chart?.pillars?.hour) },
    ],
    [chart]
  );

  const availableSignals = chart?.signals?.filter(Boolean) ?? [];

  const handleShare = async () => {
    if (!profile || !topSummary) return;
    const result = await shareOrCopy({
      title: `${me.name}님의 사주 요약`,
      text: `핵심: ${topSummary.strong}, ${topSummary.weak}\n${profile.personalitySummary}`,
    });
    showMessage(result === "shared" ? "공유 완료!" : "복사 완료! 원하는 곳에 붙여넣어 공유해보세요.");
  };

  if (!profile || !topSummary || !narratives) {
    return (
      <PageLayout title={`${me.name}님의 사주 리포트`}>
        <p className="subtitle">사주 데이터를 불러오는 중...</p>
      </PageLayout>
    );
  }

  return (
    <PageLayout
      title={`${me.name}님의 사주 리포트`}
      subtitle="핵심은 먼저, 디테일은 아래에서 천천히 확인해보세요."
      action={<button type="button" className="ghostBtn" onClick={handleShare}>공유</button>}
    >
      <section className="heroCard">
        <div className="providerStatusRow">
          <span className={`sourceBadge ${state.tone === "ok" ? "ok" : state.tone === "warn" ? "warn" : "fallback"}`}>
            {state.badge}
          </span>
          {warnings.slice(0, 2).map((w) => (
            <span key={w} className="warnBadge">{warningLabel(w)}</span>
          ))}
        </div>
        <h3>{topSummary.strong}</h3>
        <p className="statusHint">{state.detail}</p>
        <div className="summaryChips">
          <span>나를 가장 잘 설명하는 기운 · {elementLabels[topSummary.strongKey]}</span>
          <span>관계 주의 포인트 · {elementLabels[topSummary.weakKey]}</span>
        </div>
        <p className="todayLine">오늘의 한 줄 · {todayLine(topSummary.strongKey, topSummary.weakKey)}</p>
      </section>

      <section className="segmentedWrap">
        <div className="segmentedControl">
          <button type="button" className={activeTab === "pillars" ? "active" : ""} onClick={() => setActiveTab("pillars")}>사주원국</button>
          <button type="button" className={activeTab === "ten-god" ? "active" : ""} onClick={() => setActiveTab("ten-god")}>오행·십성</button>
          <button type="button" className={activeTab === "strength" ? "active" : ""} onClick={() => setActiveTab("strength")}>신강·신약</button>
        </div>
        {activeTab === "pillars" ? (
          <div className="tabPane">
            <p>사주원국 (연/월/일/시주)</p>
            <div className="pillarsGrid">
              {pillarRows.map((row) => {
                const stemKey = `${row.label}-stem`;
                const branchKey = `${row.label}-branch`;
                return (
                  <article key={row.label} className="pillarCard">
                    <strong>{row.label}</strong>
                    <em className="pillarContext">{pillarContextGuide[row.label]}</em>
                    <span>{row.value.raw}</span>
                    <div className="pillarTokenRow">
                      <button
                        type="button"
                        className={`pillarToken ${activePillarHint?.key === stemKey ? "active" : ""}`}
                        onClick={() => setActivePillarHint((prev) => prev?.key === stemKey ? null : { key: stemKey, text: `천간 ${row.value.stem} · ${guideText("stem", row.value.stem, row.label)}` })}
                      >
                        천간 {row.value.stem}
                      </button>
                      <button
                        type="button"
                        className={`pillarToken ${activePillarHint?.key === branchKey ? "active" : ""}`}
                        onClick={() => setActivePillarHint((prev) => prev?.key === branchKey ? null : { key: branchKey, text: `지지 ${row.value.branch} · ${guideText("branch", row.value.branch, row.label)}` })}
                      >
                        지지 {row.value.branch}
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
            {activePillarHint ? <p className="pillarHint">{activePillarHint.text}</p> : null}
            <small>
              {chart?.calculationSource
                ? `계산 소스: ${chart.calculationSource}${chart.ruleVersion ? ` · 규칙: ${chart.ruleVersion}` : ""}`
                : "원국 상세 계산 소스 정보는 provider 연결 시 함께 표시돼요."}
            </small>
          </div>
        ) : null}
        {activeTab === "ten-god" ? (
          <div className="tabPane">
            <p>오행은 실데이터로 반영 중, 십성은 준비 중이에요.</p>
            <div className="summaryChips">
              {Object.entries(profile.fiveElements).map(([key, value]) => (
                <span key={key}>{elementLabels[key]} {value}%</span>
              ))}
            </div>
            {availableSignals.length ? (
              <div className="summaryChips">
                {availableSignals.slice(0, 6).map((signal) => <span key={signal}>{signal}</span>)}
              </div>
            ) : (
              <small>현재 provider에서 십성용 상세 신호는 제공되지 않아 오행 중심으로 먼저 안내합니다.</small>
            )}
          </div>
        ) : null}
        {activeTab === "strength" ? (
          <div className="tabPane">
            <p>신강/신약 판정은 현재 준비 중입니다.</p>
            <small>필요 데이터 구조: 일간 기준 강약 점수, 월지 계절 가중치, 통근/투간 여부, 용신/희신 후보.</small>
            <small>지금은 오행 밸런스 + 원국 기둥을 참고해 흐름 중심으로 봐주세요.</small>
          </div>
        ) : null}
      </section>

      <ResultCard
        title="핵심 요약"
        tone="highlight"
        rows={[
          `강세: ${topSummary.strong}`,
          `보완: ${topSummary.weak}`,
          "관계 몰입도는 높고, 감정 리듬 조율이 핵심이에요.",
        ]}
      />

      <section className="elementCard sajuDashboardCard">
        <div className="fiveHeader">
          <h3 className="sectionTitle">오행 밸런스</h3>
          <span className="smallPill">대시보드</span>
        </div>
        <div className="fiveInsightRow">
          <span>강한 기운 · {elementLabels[topSummary.strongKey]}</span>
          <span>보완 기운 · {elementLabels[topSummary.weakKey]}</span>
        </div>
        <div className="fiveVisualWrap">
          <div className="fiveWheelZone">
            <div
              className="fiveWheel"
              style={{
                background: `conic-gradient(
                  ${elementColor("wood")} 0 ${profile.fiveElements.wood * 3.6}deg,
                  ${elementColor("fire")} ${profile.fiveElements.wood * 3.6}deg ${(profile.fiveElements.wood + profile.fiveElements.fire) * 3.6}deg,
                  ${elementColor("earth")} ${(profile.fiveElements.wood + profile.fiveElements.fire) * 3.6}deg ${(profile.fiveElements.wood + profile.fiveElements.fire + profile.fiveElements.earth) * 3.6}deg,
                  ${elementColor("metal")} ${(profile.fiveElements.wood + profile.fiveElements.fire + profile.fiveElements.earth) * 3.6}deg ${(profile.fiveElements.wood + profile.fiveElements.fire + profile.fiveElements.earth + profile.fiveElements.metal) * 3.6}deg,
                  ${elementColor("water")} ${(profile.fiveElements.wood + profile.fiveElements.fire + profile.fiveElements.earth + profile.fiveElements.metal) * 3.6}deg 360deg
                )`,
              }}
            >
              <div className="fiveWheelInner">
                <strong>{elementLabels[topSummary.strongKey]}</strong>
                <small>가장 강한 기운</small>
              </div>
            </div>
            <span className="wheelLabel wood">목</span>
            <span className="wheelLabel fire">화</span>
            <span className="wheelLabel earth">토</span>
            <span className="wheelLabel metal">금</span>
            <span className="wheelLabel water">수</span>
          </div>
          <p className="statusHint">오행의 상대 비율과 위치를 함께 보여줘, 기운 흐름을 더 직관적으로 볼 수 있어요.</p>
          <div className="fiveFlowLine">
            <span>목</span><i />
            <span>화</span><i />
            <span>토</span><i />
            <span>금</span><i />
            <span>수</span>
          </div>
        </div>
        <div className="elementOrbit">
          {Object.entries(profile.fiveElements).map(([key, value]) => (
            <article key={key} className="elementMiniCard">
              <div className="elementMiniHead">
                <span className="dot" style={{ background: elementColor(key) }} />
                <strong>{elementLabels[key] ?? key}</strong>
                <b>{value}%</b>
              </div>
              <div className="barTrack"><i style={{ width: `${value}%`, background: elementColor(key) }} /></div>
            </article>
          ))}
        </div>
      </section>

      <details className="foldSection">
        <summary>왜 이런 결과가 나왔을까</summary>
        <ResultCard title="근거 요약" rows={narratives.reasonCard} />
      </details>

      <details className="foldSection" open>
        <summary>성격 · 기질</summary>
        <ResultCard title="나의 기질" rows={[profile.personalitySummary, ...narratives.personality]} />
      </details>

      <details className="foldSection">
        <summary>연애 스타일</summary>
        <ResultCard title="연애 온도" rows={[profile.loveStyle, ...narratives.loveStyle]} />
      </details>

      <details className="foldSection">
        <summary>잘 맞는 상대</summary>
        <ResultCard title="이런 사람에게 끌리기 쉬워요" rows={[...profile.idealTraits, ...narratives.idealPartner]} />
      </details>

      <details className="foldSection">
        <summary>주의할 관계 패턴</summary>
        <ResultCard title="관계 주의 한마디" rows={narratives.cautionPatterns} />
      </details>

      {message ? <p className="toastText">{message}</p> : null}
    </PageLayout>
  );
}
