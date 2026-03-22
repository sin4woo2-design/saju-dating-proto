import { useEffect, useMemo, useState } from "react";
import ResultCard from "../../components/ResultCard/ResultCard";
import PageLayout from "../../components/layout/PageLayout";
import { useTransientMessage } from "../../hooks/useTransientMessage";
import { calculateSajuResult } from "../../lib/sajuEngine";
import { shareOrCopy } from "../../lib/share";
import {
  describeBranch,
  describeStem,
  elementLabel,
  getAnalysisBasisPhrase,
  getAnalysisFallbackNote,
  getAnalysisHeadlineLabel,
  getAnalysisIdentityLabel,
  getSeasonLabel,
  getStrengthLabel,
  getStrengthSupportLine,
  getTenGodLabel,
  getWeakElementCareLine,
  isChartDerivedAnalysis,
} from "../../lib/sajuAnalysis";
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

function warningDescription(code: string) {
  if (code.includes("FALLBACK_TO_MOCK_PROFILE")) {
    return "원국 데이터를 받지 못해 임시 mock 프로필로 전환됐어요.";
  }
  if (code.includes("PARTIAL")) {
    return "일부 계산 데이터가 비어 있어 가능한 범위에서 보정해서 보여주고 있어요.";
  }
  if (code.includes("TIMEOUT")) {
    return "사주 계산 서버 응답이 늦어져 임시 해석으로 전환됐어요.";
  }
  if (code.includes("UNAVAILABLE")) {
    return "사주 계산 서버에 연결되지 않아 임시 해석으로 전환됐어요.";
  }
  if (code.includes("BAD_RESPONSE")) {
    return "계산 응답 형식이 불완전해서 임시 해석을 사용하고 있어요.";
  }
  return code;
}

function providerStateLabel(providerState: "mock" | "provider" | "mock-fallback") {
  if (providerState === "provider") return "실명식 연결";
  if (providerState === "mock-fallback") return "fallback 전환";
  return "mock 모드";
}

function calculationSourceLabel(source?: string) {
  if (!source) return "미확인";
  if (source.includes("lunar")) return "실명식 계산";
  if (source === "mock-fallback") return "fallback 계산";
  if (source === "mock") return "mock 계산";
  if (source.includes("provider")) return "provider 계산";
  return source;
}

function formatLatency(latencyMs?: number) {
  if (!latencyMs || latencyMs <= 0) return "미기록";
  return `${Math.round(latencyMs)}ms`;
}

function signalLabel(signal: string) {
  return signal.replace(/_/g, " ").trim();
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

function formatSignedScore(value?: number) {
  if (typeof value !== "number") return "미제공";
  return value > 0 ? `+${value}` : `${value}`;
}

function contributionRows(weights?: Partial<Record<ElementKey, number>>) {
  if (!weights) return [] as Array<{ key: ElementKey; value: number }>;

  return (Object.entries(weights) as Array<[ElementKey, number]>)
    .map(([key, value]) => ({ key, value }))
    .filter((item) => item.value > 0)
    .sort((a, b) => b.value - a.value);
}

function todayLine(analysis: SajuAnalysis) {
  if (!isChartDerivedAnalysis(analysis)) {
    return `지금은 오행 균형을 바탕으로 읽고 있어요. ${getStrengthSupportLine(analysis.strengthLevel, analysis.usefulElements, analysis.dominantElement)} ${getWeakElementCareLine(analysis.weakestElement)}`;
  }
  return `${getAnalysisBasisPhrase(analysis)} ${getStrengthSupportLine(analysis.strengthLevel, analysis.usefulElements, analysis.dominantElement)} ${getWeakElementCareLine(analysis.weakestElement)}`;
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
      isChartDerivedAnalysis(analysis)
        ? `일간: ${analysis.dayMasterLabel}`
        : `해석 기준: ${getAnalysisIdentityLabel(analysis)}`,
      `강약: ${getStrengthLabel(analysis.strengthLevel)}`,
      `힘이 붙는 기운: ${usefulLabel}`,
      typeof analysis.supportScore === "number" && typeof analysis.regulatingScore === "number"
        ? `강약 점수: 도움 ${analysis.supportScore} / 설기·제어 ${analysis.regulatingScore}`
        : `주요 오행: 강한 축 ${elementLabel(analysis.dominantElement)} / 약한 축 ${weakLabel}`,
    ],
    personality: [
      ...(analysis.summaryLines?.slice(0, 1) ?? []),
      profile.personalitySummary,
      monthLine,
      `강한 오행은 ${elementLabel(analysis.dominantElement)}, 가장 약한 오행은 ${weakLabel}입니다.`,
    ],
      loveStyle: [
        profile.loveStyle,
        tenGodFocus?.code
          ? `${getTenGodLabel(tenGodFocus.code)} 포인트가 두드러져 기대 역할을 말로 맞춰 둘수록 관계가 훨씬 매끄러워져요.`
          : `${supportLabel} 쪽 안정감을 주는 관계일수록 마음이 오래 편안해집니다.`,
      analysis.strengthLevel === "strong"
        ? "호감이 생길수록 속도를 조금 늦추고 질문을 먼저 두면 관계 피로가 줄어듭니다."
        : analysis.strengthLevel === "weak"
          ? "천천히 가까워져도 꾸준히 이어 가는 리듬이 잘 맞습니다."
          : "감정 공감과 현실 조율을 함께 챙기는 대화가 잘 맞습니다.",
    ],
      idealPartner: [
        ...profile.idealTraits,
        `${usefulLabel} 쪽 감각처럼 지금 명식의 빈틈을 차분히 받쳐 주는 사람이 특히 잘 맞아요.`,
      ],
      cautionPatterns: [
        analysis.strengthReason,
        ...(analysis.notes?.length ? [`근거 메모: ${analysis.notes.slice(0, 3).join(" · ")}`] : []),
        `주의 기운은 ${cautionLabel} 쪽이에요. 이쪽으로 기울면 관계 판단이 급해질 수 있어요.`,
        getWeakElementCareLine(analysis.weakestElement),
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
  const [reloadTick, setReloadTick] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const { message, showMessage } = useTransientMessage();

  useEffect(() => {
    let active = true;
    setIsRefreshing(true);
    calculateSajuResult(me)
      .then((result) => {
        if (!active) return;
        setProfile(result.profile);
        setProviderState(result.providerState);
        setWarnings(result.warnings ?? []);
        setChart(result.chart);
        setIsRefreshing(false);
      })
      .catch(() => {
        if (active) setIsRefreshing(false);
        if (active) showMessage("사주 계산에 실패했어요. 잠시 후 다시 시도해 주세요.");
      });
    return () => { active = false; };
  }, [me, reloadTick, showMessage]);

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
      headline: `${getAnalysisHeadlineLabel(analysis)} · ${getStrengthLabel(analysis.strengthLevel)}`,
    };
  }, [profile, sortedElements]);

  const detailSections = useMemo(
    () => (profile?.analysis ? buildDetailSections(profile, profile.analysis) : null),
    [profile]
  );

  const pillarRows = useMemo(
    () => [
      { label: "시주", key: "hour" as const, value: splitPillar(profile?.analysis?.pillarDetails?.hour?.raw ?? chart?.pillars?.hour), detail: profile?.analysis?.pillarDetails?.hour },
      { label: "일주", key: "day" as const, value: splitPillar(profile?.analysis?.pillarDetails?.day?.raw ?? chart?.pillars?.day), detail: profile?.analysis?.pillarDetails?.day },
      { label: "월주", key: "month" as const, value: splitPillar(profile?.analysis?.pillarDetails?.month?.raw ?? chart?.pillars?.month), detail: profile?.analysis?.pillarDetails?.month },
      { label: "연주", key: "year" as const, value: splitPillar(profile?.analysis?.pillarDetails?.year?.raw ?? chart?.pillars?.year), detail: profile?.analysis?.pillarDetails?.year },
    ],
    [chart, profile]
  );

  const hasPillars = useMemo(
    () => pillarRows.some((row) => row.value.raw !== "-"),
    [pillarRows]
  );

  const visibleTenGods = useMemo(
    () => profile?.analysis?.tenGods.filter((item) => item.pillar !== "day" && item.code) ?? [],
    [profile]
  );

  const breakdownCards = useMemo(() => {
    const breakdown = profile?.analysis?.elementBreakdown ?? chart?.breakdown;
    if (!breakdown) return [];

    return [
      { label: "천간 기여", rows: contributionRows(breakdown.stemContribution) },
      { label: "지지 기여", rows: contributionRows(breakdown.branchContribution) },
      { label: "월지 보정", rows: contributionRows(breakdown.monthBranchBonusContribution) },
      { label: "지장간 기여", rows: contributionRows(breakdown.hiddenStemContribution) },
    ].filter((card) => card.rows.length);
  }, [chart, profile]);

  const handleShare = async () => {
    if (!profile || !topSummary) return;
    const result = await shareOrCopy({
      title: `${me.name}님의 사주 요약`,
      text: `${topSummary.headline}\n핵심 오행: ${topSummary.strong}, ${topSummary.weak}\n${profile.personalitySummary}`,
    });
    showMessage(result === "shared" ? "공유 완료!" : "복사 완료!");
  };

  const handleRefresh = () => {
    if (isRefreshing) return;
    setActivePillarHint(null);
    setReloadTick((value) => value + 1);
    showMessage("사주 계산을 다시 요청하고 있어요.");
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
  const fallbackNote = getAnalysisFallbackNote(topSummary.analysis);
  const statusHeadline = providerState === "provider" && hasPillars
    ? "원국 기반 계산이 정상 연결되어 있어요."
    : providerState === "mock-fallback"
      ? "실시간 계산이 불안정해서 임시 해석으로 전환되었어요."
      : providerState === "mock"
        ? "현재는 mock 기반 계산 결과를 보고 있어요."
        : "계산 상태를 확인하는 중이에요.";
  const statusDescription = hasPillars
    ? "연·월·일·시 기둥이 들어와서 일간, 월지, 십성 해석까지 함께 보여주고 있어요."
    : "원국 기둥이 아직 없어서 오행 균형과 입력값 기반의 임시 해석이 중심이 됩니다.";
  const statusItems = [
    { label: "계산 방식", value: calculationSourceLabel(chart?.calculationSource) },
    { label: "연결 상태", value: providerStateLabel(providerState) },
    { label: "원국 상태", value: hasPillars ? "연·월·일·시 반영" : "원국 미수신" },
    { label: "응답 시간", value: formatLatency(chart?.latencyMs) },
  ];
  const warningDetails = Array.from(new Set(warnings.map((warning) => warningDescription(warning))));
  const signalPreview = Array.from(new Set((chart?.signals ?? []).map((signal) => signalLabel(signal)))).slice(0, 6);
  const requestMeta = [
    chart?.ruleVersion ? { label: "Rule version", value: chart.ruleVersion } : null,
    chart?.requestId ? { label: "Request ID", value: chart.requestId } : null,
    chart?.providerVersion ? { label: "Provider version", value: chart.providerVersion } : null,
    chart?.engineVersion ? { label: "Engine version", value: chart.engineVersion } : null,
  ].filter((item): item is { label: string; value: string } => Boolean(item));

  return (
    <PageLayout
      title={`${me.name}님의 사주 리포트`}
      subtitle="핵심은 먼저, 디테일은 아래에서 천천히 확인해보세요."
      action={
        <div className="sajuTopActions">
          <button type="button" className="sajuActionBtn" onClick={handleShare}>
            공유
          </button>
          <button type="button" className="sajuActionBtn primary" onClick={handleRefresh} disabled={isRefreshing}>
            {isRefreshing ? "재계산 중..." : "다시 계산"}
          </button>
        </div>
      }
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
        {fallbackNote ? <p className="sajuHeroNote">{fallbackNote}</p> : null}
        <div className="sajuHeroChips">
          <span className="sajuChip">주도 오행 · {elementLabel(topSummary.analysis.dominantElement)}</span>
          <span className="sajuChip">보완 오행 · {elementLabel(topSummary.analysis.weakestElement)}</span>
          <span className="sajuChip">활용 기운 · {joinElementLabels(topSummary.analysis.usefulElements)}</span>
        </div>
        <p className="sajuHeroToday">오늘의 한 줄 · {todayLine(topSummary.analysis)}</p>
      </section>

      {/* ── SAJU TABS ── */}
      <section className={`calcStatusCard ${tone} anim-fade-in anim-delay-1`}>
        <div className="calcStatusHeader">
          <div>
            <p className="calcEyebrow">계산 상태</p>
            <h3>{statusHeadline}</h3>
            <p>{statusDescription}</p>
          </div>
          <button type="button" className="statusRefreshBtn" onClick={handleRefresh} disabled={isRefreshing}>
            {isRefreshing ? "계산 중..." : "다시 계산"}
          </button>
        </div>

        <div className="calcStatusGrid">
          {statusItems.map((item) => (
            <article key={item.label} className="calcMetric">
              <small>{item.label}</small>
              <strong>{item.value}</strong>
            </article>
          ))}
        </div>

        {!hasPillars ? (
          <p className="calcStatusNote">
            현재는 원국 기둥을 아직 받지 못해서 임시 해석 중심으로 보여주고 있어요. 다시 계산에 성공하면 연주, 월주, 일주, 시주와 십성 해석이 함께 채워집니다.
          </p>
        ) : null}

        {warningDetails.length ? (
          <div className="calcWarningList">
            {warningDetails.map((detail) => (
              <div key={detail} className="calcWarningItem">
                <strong>안내</strong>
                <p>{detail}</p>
              </div>
            ))}
          </div>
        ) : null}

        {signalPreview.length ? (
          <div className="calcSignalGroup">
            <strong>근거 신호</strong>
            <div className="calcSignalChips">
              {signalPreview.map((signal) => (
                <span key={signal} className="sajuChip subtle">
                  {signal}
                </span>
              ))}
            </div>
          </div>
        ) : null}

        {requestMeta.length ? (
          <div className="calcMetaList">
            {requestMeta.map((item) => (
              <div key={item.label} className="calcMetaPair">
                <span>{item.label}</span>
                <code>{item.value}</code>
              </div>
            ))}
          </div>
        ) : null}
      </section>

      <section className="sajuTabSection anim-fade-in anim-delay-2">
        <div className="segmentedWrap">
          <button type="button" className={activeTab === "pillars" ? "active" : ""} onClick={() => setActiveTab("pillars")}>사주원국</button>
          <button type="button" className={activeTab === "ten-god" ? "active" : ""} onClick={() => setActiveTab("ten-god")}>오행·십성</button>
          <button type="button" className={activeTab === "strength" ? "active" : ""} onClick={() => setActiveTab("strength")}>신강·신약</button>
        </div>

        {activeTab === "pillars" && (
          <div className="tabContent">
            <h4 className="tabTitle">사주원국 (연/월/일/시주)</h4>
            {hasPillars ? (
              <>
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
                        {row.detail?.hiddenStems?.length ? (
                          <p className="pillarMetaLine">지장간 · {row.detail.hiddenStems.join(" · ")}</p>
                        ) : null}
                        {row.detail?.stemTenGodLabel ? (
                          <p className="pillarMetaLine">천간 십성 · {row.detail.stemTenGodLabel}</p>
                        ) : null}
                        {typeof row.detail?.supportWeight === "number" && row.detail.supportWeight > 0 ? (
                          <p className="pillarMetaLine">근 보강 점수 · {row.detail.supportWeight}</p>
                        ) : null}
                      </article>
                    );
                  })}
                </div>
                {activePillarHint && <div className="pillarTooltip anim-scale-in">{activePillarHint.text}</div>}
              </>
            ) : (
              <div className="tabEmptyState">
                <strong>사주원국을 아직 불러오지 못했어요</strong>
                <p>현재는 원국 데이터를 받지 못해 오행 균형 기반 임시 해석만 보여주고 있어요. 실제 연결이 복구되면 연주·월주·일주·시주가 이 영역에 표시됩니다.</p>
              </div>
            )}
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
                    <span>{item.label ?? (item.code ? getTenGodLabel(item.code) : "해석 대기")}</span>
                    <p>{item.summary}</p>
                  </article>
                ))}
              </div>
            ) : (
              <p className="tabHint">
                {isChartDerivedAnalysis(topSummary.analysis)
                  ? "십성은 아직 추정 근거가 부족해 표시할 항목이 없어요."
                  : "원국 천간을 불러오지 못해 십성은 아직 계산하지 못했어요."}
              </p>
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
                <p>지금은 이 기운을 살리는 말투와 행동을 쓸수록 힘이 한쪽으로 쏠리지 않고 균형이 잡혀요.</p>
              </article>
              {typeof topSummary.analysis.supportScore === "number" || typeof topSummary.analysis.regulatingScore === "number" ? (
                <article className="strengthCard">
                  <small>강약 점수</small>
                  <strong>{formatSignedScore(topSummary.analysis.strengthScore)}</strong>
                  <p>
                    도움 {formatSignedScore(topSummary.analysis.supportScore)} · 설기/제어 {formatSignedScore(topSummary.analysis.regulatingScore)}
                    {typeof topSummary.analysis.seasonalBonus === "number" ? ` · 월지 보정 ${formatSignedScore(topSummary.analysis.seasonalBonus)}` : ""}
                  </p>
                </article>
              ) : null}
              {typeof topSummary.analysis.rootSupportScore === "number" ? (
                <article className="strengthCard">
                  <small>근 보강</small>
                  <strong>{formatSignedScore(topSummary.analysis.rootSupportScore)}</strong>
                  <p>지지에서 일간과 인성 축을 받치는 힘을 누적한 값이에요.</p>
                </article>
              ) : null}
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

      {breakdownCards.length ? (
        <section className="breakdownCard anim-fade-in anim-delay-2">
          <div className="fiveHeader">
            <h4>오행 기여도 분해</h4>
            <span className="badge">{chart?.breakdown?.ruleVersion ?? chart?.ruleVersion ?? "basis-v2"}</span>
          </div>
          <div className="breakdownGrid">
            {breakdownCards.map((card) => (
              <article key={card.label} className="breakdownSection">
                <strong>{card.label}</strong>
                <div className="breakdownRows">
                  {card.rows.map((row) => (
                    <div key={`${card.label}-${row.key}`} className="breakdownRow">
                      <span style={{ color: elementColorKey(row.key) }}>{elementLabel(row.key)}</span>
                      <div className="barTrack compact">
                        <div className="barFill" style={{ width: `${Math.max(6, Math.min(100, row.value * 16))}%`, backgroundColor: elementColorKey(row.key) }} />
                      </div>
                      <b>{row.value.toFixed(1)}</b>
                    </div>
                  ))}
                </div>
              </article>
            ))}
          </div>
          {chart?.breakdown ? (
            <p className="breakdownNote">
              우승 오행은 {elementLabel(chart.breakdown.winner)}이고, {chart.breakdown.earthDampeningEnabled ? `토 감쇠 ${chart.breakdown.earthDampeningApplied.toFixed(1)}이 반영됐어요.` : "현재 토 감쇠 보정은 꺼져 있어요."}
            </p>
          ) : null}
        </section>
      ) : null}

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
