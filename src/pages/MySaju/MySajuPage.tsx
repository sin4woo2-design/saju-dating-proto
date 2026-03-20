import { useEffect, useMemo, useState } from "react";
import ResultCard from "../../components/ResultCard/ResultCard";
import PageLayout from "../../components/layout/PageLayout";
import { useTransientMessage } from "../../hooks/useTransientMessage";
import { calculateSajuResult } from "../../lib/sajuEngine";
import { shareOrCopy } from "../../lib/share";
import { describeBranch, describeStem, elementLabel, getSeasonLabel, getStrengthLabel, getTenGodLabel } from "../../lib/sajuAnalysis";
import type { ElementKey, SajuAnalysis, SajuProfile, UserProfileInput } from "../../types/saju";
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

function elementColorKey(key: ElementKey) {
  const map: Record<ElementKey, string> = {
    wood: "var(--color-wood)",
    fire: "var(--color-fire)",
    earth: "var(--color-earth)",
    metal: "var(--color-metal)",
    water: "var(--color-water)",
  };
  return map[key];
}

function joinElementLabels(elements: ElementKey[]) {
  return elements.map((element) => elementLabel(element)).join("·");
}

function todayLine(analysis: SajuAnalysis) {
  const usefulLabel = joinElementLabels(analysis.usefulElements);
  const weakLabel = elementLabel(analysis.weakestElement);
  return `${analysis.dayMasterLabel} 기준으로는 ${usefulLabel} 기운을 활용하고, 약한 ${weakLabel} 축을 생활 리듬에서 보완하는 하루가 좋아요.`;
}

function splitPillar(value?: string) {
  if (!value) return { stem: "-", branch: "-", raw: "-" };
  const trimmed = value.trim();
  if (trimmed.length >= 2) {
    return { stem: trimmed[0], branch: trimmed.slice(1), raw: trimmed };
  }
  return { stem: trimmed, branch: "-", raw: trimmed };
}

function pillarHintText(type: "stem" | "branch", value: string) {
  if (value === "-" || !value.trim()) {
    return type === "stem" ? "천간 정보가 아직 없어요." : "지지 정보가 아직 없어요.";
  }

  return type === "stem" ? describeStem(value) : describeBranch(value);
}

function buildDetailSections(profile: SajuProfile, analysis: SajuAnalysis) {
  const usefulLabel = joinElementLabels(analysis.usefulElements);
  const supportLabel = joinElementLabels(analysis.supportElements);
  const cautionLabel = joinElementLabels(analysis.cautionElements);
  const weakLabel = elementLabel(analysis.weakestElement);
  const monthLine = analysis.monthBranchLabel
    ? `${analysis.monthBranchLabel} 월지가 계절의 중심축으로 작동합니다.`
    : `${getSeasonLabel(analysis.season)} 흐름을 기준 계절감으로 해석하고 있어요.`;
  const tenGodFocus = analysis.tenGods.find((item) => item.pillar === "month" && item.code)
    ?? analysis.tenGods.find((item) => item.pillar !== "day" && item.code);

  return {
    summaryRows: [
      `일간: ${analysis.dayMasterLabel}`,
      `강약: ${getStrengthLabel(analysis.strengthLevel)}`,
      `보완 기운: ${usefulLabel}`,
    ],
    personality: [
      profile.personalitySummary,
      monthLine,
      `강한 오행은 ${elementLabel(analysis.dominantElement)}, 가장 약한 오행은 ${weakLabel}입니다.`,
    ],
    loveStyle: [
      profile.loveStyle,
      tenGodFocus?.code
        ? `${getTenGodLabel(tenGodFocus.code)} 포인트가 두드러져 역할 기대치를 말로 맞출수록 관계가 편안합니다.`
        : `${supportLabel} 기운이 보강되는 관계일수록 안정감이 커집니다.`,
      analysis.strengthLevel === "strong"
        ? "호감이 생길수록 속도를 조금 늦추고 질문을 먼저 두면 관계 피로가 줄어듭니다."
        : analysis.strengthLevel === "weak"
          ? "천천히 가까워져도 꾸준히 이어 가는 리듬이 잘 맞습니다."
          : "감정 공감과 현실 조율을 함께 챙기는 대화가 잘 맞습니다.",
    ],
    idealPartner: [
      ...profile.idealTraits,
      `${usefulLabel} 기운처럼 지금 명식의 균형을 맞춰 줄 수 있는 사람이 특히 잘 맞습니다.`,
    ],
    cautionPatterns: [
      analysis.strengthReason,
      `주의 기운은 ${cautionLabel}입니다. 이 축이 과해지면 관계 판단이 급해질 수 있어요.`,
      `${weakLabel} 기운이 약한 날에는 휴식, 정리, 속도 조절을 먼저 챙기는 편이 좋습니다.`,
    ],
  };
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
    return () => { active = false; };
  }, [me, showMessage]);

  const sortedElements = useMemo(() => {
    if (!profile) return [];
    return (Object.entries(profile.fiveElements) as Array<[ElementKey, number]>).sort((a, b) => b[1] - a[1]);
  }, [profile]);

  const topSummary = useMemo(() => {
    if (!profile?.analysis || !sortedElements.length) return null;

    const analysis = profile.analysis;
    return {
      analysis,
      strongKey: sortedElements[0][0],
      weakKey: sortedElements[sortedElements.length - 1][0],
      strong: `${elementLabel(sortedElements[0][0])} 강세`,
      weak: `${elementLabel(sortedElements[sortedElements.length - 1][0])} 보완 필요`,
      headline: `${analysis.dayMasterLabel} · ${getStrengthLabel(analysis.strengthLevel)}`,
    };
  }, [profile, sortedElements]);

  const detailSections = useMemo(
    () => (profile?.analysis ? buildDetailSections(profile, profile.analysis) : null),
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

  const visibleTenGods = useMemo(
    () => profile?.analysis?.tenGods.filter((item) => item.pillar !== "day" && item.code) ?? [],
    [profile]
  );

  const handleShare = async () => {
    if (!profile || !topSummary) return;
    const result = await shareOrCopy({
      title: `${me.name}님의 사주 요약`,
      text: `${topSummary.headline}\n핵심 오행: ${topSummary.strong}, ${topSummary.weak}\n${profile.personalitySummary}`,
    });
    showMessage(result === "shared" ? "공유 완료!" : "복사 완료!");
  };

  if (!profile || !topSummary || !detailSections) {
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
        <h3 className="sajuHeroTitle">{topSummary.headline}</h3>
        <div className="sajuHeroChips">
          <span className="sajuChip">주도 오행 · {elementLabel(topSummary.analysis.dominantElement)}</span>
          <span className="sajuChip">보완 오행 · {elementLabel(topSummary.analysis.weakestElement)}</span>
          <span className="sajuChip">활용 기운 · {joinElementLabels(topSummary.analysis.usefulElements)}</span>
        </div>
        <p className="sajuHeroToday">오늘의 한 줄 · {todayLine(topSummary.analysis)}</p>
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
                        onClick={() => setActivePillarHint((prev) => prev?.key === stemKey ? null : { key: stemKey, text: `천간 ${row.value.stem} · ${pillarHintText("stem", row.value.stem)}` })}
                      >
                        {row.value.stem}
                      </button>
                      <button
                        type="button"
                        className={activePillarHint?.key === branchKey ? "active" : ""}
                        onClick={() => setActivePillarHint((prev) => prev?.key === branchKey ? null : { key: branchKey, text: `지지 ${row.value.branch} · ${pillarHintText("branch", row.value.branch)}` })}
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
            {visibleTenGods.length ? (
              <div className="insightGrid">
                {visibleTenGods.map((item) => (
                  <article key={`${item.pillar}-${item.stem}`} className="insightCard">
                    <small>{item.pillar === "year" ? "연간" : item.pillar === "month" ? "월간" : "시간"}</small>
                    <strong>{item.stem}</strong>
                    <span>{item.code ? getTenGodLabel(item.code) : "해석 대기"}</span>
                    <p>{item.summary}</p>
                  </article>
                ))}
              </div>
            ) : (
              <p className="tabHint">십성은 아직 추정 근거가 부족해 표시할 항목이 없어요.</p>
            )}
          </div>
        )}
        {activeTab === "strength" && (
          <div className="tabContent">
            <div className="strengthGrid">
              <article className="strengthCard">
                <small>강약 판정</small>
                <strong>{getStrengthLabel(topSummary.analysis.strengthLevel)}</strong>
                <p>{topSummary.analysis.strengthReason}</p>
              </article>
              <article className="strengthCard">
                <small>계절감</small>
                <strong>{topSummary.analysis.monthBranchLabel ?? getSeasonLabel(topSummary.analysis.season)}</strong>
                <p>{getSeasonLabel(topSummary.analysis.season)} 흐름을 기준으로 일간의 힘을 읽었어요.</p>
              </article>
              <article className="strengthCard">
                <small>활용 기운</small>
                <strong>{joinElementLabels(topSummary.analysis.usefulElements)}</strong>
                <p>지금 명식에서는 이 기운을 쓰는 생활 리듬과 관계 패턴이 균형 회복에 도움 됩니다.</p>
              </article>
            </div>
          </div>
        )}
      </section>

      {/* ── CORE SUMMARY ── */}
      <ResultCard
        title="핵심 요약"
        tone="highlight"
        rows={detailSections.summaryRows}
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
                <strong>{elementLabel(topSummary.strongKey as ElementKey)}</strong>
                <small>가장 강함</small>
              </div>
            </div>
          </div>

          <div className="elementBars">
            {(Object.entries(profile.fiveElements) as Array<[ElementKey, number]>).map(([key, value]) => (
              <div key={key} className="elementBarRow">
                <span className="elementLabel" style={{ color: elementColorKey(key) }}>
                  {elementLabel(key)}
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
              {detailSections.personality.map((text, idx) => (
                <li key={idx}>{text}</li>
              ))}
            </ul>
          </div>
        </details>
        
        <details className="foldSection">
          <summary>연애 스타일</summary>
          <div className="foldContent">
            <ul className="detailList">
              {detailSections.loveStyle.map((text, idx) => (
                <li key={idx}>{text}</li>
              ))}
            </ul>
          </div>
        </details>

        <details className="foldSection">
          <summary>잘 맞는 상대</summary>
          <div className="foldContent">
            <ul className="detailList">
              {detailSections.idealPartner.map((text, idx) => (
                <li key={idx}>{text}</li>
              ))}
            </ul>
          </div>
        </details>

        <details className="foldSection">
          <summary>주의할 관계 패턴</summary>
          <div className="foldContent">
            <ul className="detailList">
              {detailSections.cautionPatterns.map((text, idx) => (
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
