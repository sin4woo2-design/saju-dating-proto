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
import "./MySajuPage.css";

interface Props {
  me: UserProfileInput;
}

function warningLabel(code: string) {
  if (code.includes("PARTIAL")) return "부분 데이터";
  if (code.includes("TIMEOUT")) return "지연 발생";
  if (code.includes("UNAVAILABLE")) return "연결 불가";
  return code;
}

function statusTone(providerState: string, warnings: string[]) {
  if (providerState === "mock" || providerState === "mock-fallback") return "fallback";
  if (warnings.some((w) => w.includes("PARTIAL"))) return "warn";
  return "ok";
}

function statusBadgeText(providerState: string, warnings: string[]) {
  if (providerState === "mock") return "mock 모드";
  if (providerState === "mock-fallback") return "fallback 사용";
  if (warnings.some((w) => w.includes("PARTIAL"))) return "일부 보정됨";
  return "실계산 사용";
}

function elementColorKey(key: string) {
  const map: Record<string, string> = {
    wood: "var(--color-wood)",
    fire: "var(--color-fire)",
    earth: "var(--color-earth)",
    metal: "var(--color-metal)",
    water: "var(--color-water)",
  };
  return map[key] ?? "var(--color-gold-400)";
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

const stemGuide: Record<string, string> = { /* same content */
  갑: "곧고 시작 에너지가 강한 기운이에요.", 을: "유연하고 섬세하게 적응하는 기운이에요.",
  병: "밝고 표현력이 강한 태양형 기운이에요.", 정: "따뜻하고 감정 밀도가 높은 기운이에요.",
  무: "중심을 잡고 버티는 안정형 기운이에요.", 기: "배려와 조율에 강한 현실형 기운이에요.",
  경: "판단이 빠르고 기준이 분명한 기운이에요.", 신: "정교함·디테일에 강한 기운이에요.",
  임: "흐름을 크게 보고 확장하는 기운이에요.", 계: "깊이 있게 관찰하고 축적하는 기운이에요.",
};

const branchGuide: Record<string, string> = { /* same content */
  자: "감정 흐름이 빠르고 반응성이 높은 편이에요.", 축: "천천히 단단해지는 성향이 강해요.",
  인: "새로운 시도를 밀어붙이는 힘이 있어요.", 묘: "관계 감수성과 조화 감각이 좋은 편이에요.",
  진: "현실 감각과 확장 욕구가 함께 있는 타입이에요.", 사: "열정과 몰입이 빠르게 올라오는 편이에요.",
  오: "표현력과 존재감이 강하게 드러나요.", 미: "배려와 생활 안정감을 중요하게 보는 편이에요.",
  신: "판단과 실행의 속도가 빠른 편이에요.", 유: "기준을 정리하고 완성도를 높이는 타입이에요.",
  술: "책임감과 현실적인 판단이 강한 편이에요.", 해: "공감력과 직관이 깊게 작동하는 편이에요.",
};



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
    return () => { active = false; };
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

  const narratives = useMemo(
    () => (profile ? buildSajuNarratives(profile.fiveElements) : null),
    [profile]
  );

  const pillarRows = useMemo(
    () => [
      { label: "시주", value: splitPillar(chart?.pillars?.hour) },
      { label: "일주", value: splitPillar(chart?.pillars?.day) },
      { label: "월주", value: splitPillar(chart?.pillars?.month) },
      { label: "연주", value: splitPillar(chart?.pillars?.year) },
    ],
    [chart]
  );

  const handleShare = async () => {
    if (!profile || !topSummary) return;
    const result = await shareOrCopy({
      title: `${me.name}님의 사주 요약`,
      text: `핵심: ${topSummary.strong}, ${topSummary.weak}\n${profile.personalitySummary}`,
    });
    showMessage(result === "shared" ? "공유 완료!" : "복사 완료!");
  };

  if (!profile || !topSummary || !narratives) {
    return (
      <PageLayout title={`${me.name}님의 사주 리포트`}>
        <div className="sajuHero skeleton" style={{ minHeight: "180px", marginBottom: "var(--space-4)" }} />
        <div className="skeleton" style={{ height: "40px", borderRadius: "var(--radius-lg)", marginBottom: "var(--space-4)" }} />
        <div className="skeleton" style={{ height: "200px", borderRadius: "var(--radius-xl)", marginBottom: "var(--space-4)" }} />
        <div className="skeleton" style={{ height: "120px", borderRadius: "var(--radius-xl)", marginBottom: "var(--space-4)" }} />
      </PageLayout>
    );
  }

  const tone = statusTone(providerState, warnings);
  const badgeText = statusBadgeText(providerState, warnings);

  return (
    <PageLayout
      title={`${me.name}님의 사주 리포트`}
      subtitle="핵심은 먼저, 디테일은 아래에서 천천히 확인해보세요."
      action={<button type="button" className="sajuShareBtn" onClick={handleShare}>공유</button>}
    >
      {/* ── HERO SUMMARY ── */}
      <section className="sajuHero anim-slide-up">
        <div className="sajuHeroHeader">
          <span className={`statusBadge ${tone}`}>{badgeText}</span>
          {warnings.slice(0, 2).map((w) => (
            <span key={w} className="statusBadge warn">{warningLabel(w)}</span>
          ))}
        </div>
        <h3 className="sajuHeroTitle">{topSummary.strong}</h3>
        <div className="sajuHeroChips">
          <span className="sajuChip">나를 잘 설명하는 기운 · {elementLabels[topSummary.strongKey]}</span>
          <span className="sajuChip">관계 주의 포인트 · {elementLabels[topSummary.weakKey]}</span>
        </div>
        <p className="sajuHeroToday">오늘의 한 줄 · {todayLine(topSummary.strongKey, topSummary.weakKey)}</p>
      </section>

      {/* ── SAJU TABS ── */}
      <section className="sajuTabSection anim-fade-in anim-delay-1">
        <div className="segmentedWrap">
          <button type="button" className={activeTab === "pillars" ? "active" : ""} onClick={() => setActiveTab("pillars")}>사주원국</button>
          <button type="button" className={activeTab === "ten-god" ? "active" : ""} onClick={() => setActiveTab("ten-god")}>오행·십성</button>
          <button type="button" className={activeTab === "strength" ? "active" : ""} onClick={() => setActiveTab("strength")}>신강·신약</button>
        </div>

        {activeTab === "pillars" && (
          <div className="tabContent">
            <h4 className="tabTitle">사주원국 (연/월/일/시주)</h4>
            <div className="pillarsGridRow">
              {pillarRows.map((row) => {
                const stemKey = `${row.label}-stem`;
                const branchKey = `${row.label}-branch`;
                return (
                  <article key={row.label} className="pillarCard">
                    <div className="pillarHead">
                      <strong>{row.label}</strong>
                    </div>
                    <span className="pillarHanja">{row.value.raw}</span>
                    <div className="pillarActions">
                      <button
                        type="button"
                        className={activePillarHint?.key === stemKey ? "active" : ""}
                        onClick={() => setActivePillarHint((prev) => prev?.key === stemKey ? null : { key: stemKey, text: `천간 ${row.value.stem} · ${stemGuide[row.value.stem] || ""}` })}
                      >
                        {row.value.stem}
                      </button>
                      <button
                        type="button"
                        className={activePillarHint?.key === branchKey ? "active" : ""}
                        onClick={() => setActivePillarHint((prev) => prev?.key === branchKey ? null : { key: branchKey, text: `지지 ${row.value.branch} · ${branchGuide[row.value.branch] || ""}` })}
                      >
                        {row.value.branch}
                      </button>
                    </div>
                  </article>
                );
              })}
            </div>
            {activePillarHint && <div className="pillarTooltip anim-scale-in">{activePillarHint.text}</div>}
          </div>
        )}

        {activeTab === "ten-god" && (
          <div className="tabContent">
            <p className="tabHint">오행은 실데이터 반영 중, 십성은 준비 중입니다.</p>
          </div>
        )}
        {activeTab === "strength" && (
          <div className="tabContent">
            <p className="tabHint">신강/신약 판정 기능은 현재 고도화 준비 중입니다.</p>
          </div>
        )}
      </section>

      {/* ── CORE SUMMARY ── */}
      <ResultCard
        title="핵심 요약"
        tone="highlight"
        rows={[
          `강세: ${topSummary.strong}`,
          `보완: ${topSummary.weak}`,
          "관계 몰입도는 높고, 감정 리듬 조율이 핵심이에요.",
        ]}
      />

      {/* ── 5 ELEMENTS CHART ── */}
      <section className="fiveBalanceCard anim-fade-in anim-delay-2">
        <div className="fiveHeader">
          <h4>오행 밸런스</h4>
          <span className="badge">대시보드</span>
        </div>
        
        <div className="fiveChartLayout">
          <div className="donutChartWrap">
            <div
              className="donutChart"
              style={{
                background: `conic-gradient(
                  var(--color-wood) 0 ${profile.fiveElements.wood * 3.6}deg,
                  var(--color-fire) ${profile.fiveElements.wood * 3.6}deg ${(profile.fiveElements.wood + profile.fiveElements.fire) * 3.6}deg,
                  var(--color-earth) ${(profile.fiveElements.wood + profile.fiveElements.fire) * 3.6}deg ${(profile.fiveElements.wood + profile.fiveElements.fire + profile.fiveElements.earth) * 3.6}deg,
                  var(--color-metal) ${(profile.fiveElements.wood + profile.fiveElements.fire + profile.fiveElements.earth) * 3.6}deg ${(profile.fiveElements.wood + profile.fiveElements.fire + profile.fiveElements.earth + profile.fiveElements.metal) * 3.6}deg,
                  var(--color-water) ${(profile.fiveElements.wood + profile.fiveElements.fire + profile.fiveElements.earth + profile.fiveElements.metal) * 3.6}deg 360deg
                )`
              }}
            >
              <div className="donutInner">
                <strong>{elementLabels[topSummary.strongKey]}</strong>
                <small>가장 강함</small>
              </div>
            </div>
          </div>

          <div className="elementBars">
            {Object.entries(profile.fiveElements).map(([key, value]) => (
              <div key={key} className="elementBarRow">
                <span className="elementLabel" style={{ color: elementColorKey(key) }}>
                  {elementLabels[key] ?? key}
                </span>
                <div className="barTrack">
                  <div className="barFill" style={{ width: `${Math.max(2, value)}%`, backgroundColor: elementColorKey(key) }} />
                </div>
                <span className="elementValue">{value}%</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── ACCORDIONS ── */}
      <div className="sajuDetailsGroup anim-fade-in anim-delay-3">
        <details className="foldSection" open>
          <summary>나의 기질</summary>
          <div className="foldContent">
            <ul className="detailList">
              {[profile.personalitySummary, ...narratives.personality].map((text, idx) => (
                <li key={idx}>{text}</li>
              ))}
            </ul>
          </div>
        </details>
        
        <details className="foldSection">
          <summary>연애 스타일</summary>
          <div className="foldContent">
            <ul className="detailList">
              {[profile.loveStyle, ...narratives.loveStyle].map((text, idx) => (
                <li key={idx}>{text}</li>
              ))}
            </ul>
          </div>
        </details>

        <details className="foldSection">
          <summary>잘 맞는 상대</summary>
          <div className="foldContent">
            <ul className="detailList">
              {[...profile.idealTraits, ...narratives.idealPartner].map((text, idx) => (
                <li key={idx}>{text}</li>
              ))}
            </ul>
          </div>
        </details>

        <details className="foldSection">
          <summary>주의할 관계 패턴</summary>
          <div className="foldContent">
            <ul className="detailList">
              {narratives.cautionPatterns.map((text, idx) => (
                <li key={idx}>{text}</li>
              ))}
            </ul>
          </div>
        </details>
      </div>

      {message && <p className="toastMsg anim-slide-up">{message}</p>}
    </PageLayout>
  );
}
