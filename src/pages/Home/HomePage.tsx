import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import PageLayout from "../../components/layout/PageLayout";
import type { HomeNarrativeSnapshot } from "../../lib/engine";
import { buildDailyFortuneSnapshotFromProfile, calculateDailyFortuneSnapshot } from "../../lib/dailyFortune";
import { buildMockHomeNarrative } from "../../lib/engine/homeNarrative";
import { calculateSajuResult } from "../../lib/sajuEngine";
import type { UserProfileInput } from "../../types/saju";
import "./HomePage.css";

interface Props {
  me: UserProfileInput;
  isLoggedIn: boolean;
  onRequestLogin: () => void;
}

const defaultHeroLead = "오늘은 대화의 시작 톤이 흐름을 만듭니다.";
const defaultHeroSupport = "첫 문장을 부드럽게 열면 반응도 한결 부드러워져요.";

const defaultSummary: [string, string, string] = [
  "핵심 대화는 오늘 짧게 시작하세요.",
  "속도보다 톤을 맞추면 흐름이 안정돼요.",
  "오후에 집중이 올라오니 핵심을 배치하세요.",
];

const defaultPoints = {
  conversation: "짧고 명확한 한 문장이 통하는 날이에요.",
  wealth: "작은 지출은 저녁 전에 정리하면 좋아요.",
  caution: "감정 반응보다 일정 우선순위를 먼저 잡아보세요.",
};

const defaultTimeFlow = {
  morning: "가벼운 할 일을 먼저 정리하세요.",
  afternoon: "핵심 업무와 중요한 대화에 집중하세요.",
  evening: "관계 대화와 마무리 정리에 좋아요.",
};

function simplifyHeroLead(value: string) {
  return value
    .replace(/^[가-힣]{2,3} 일간은\s*/, "")
    .replace(/^오행 기반 임시 해석은\s*/, "")
    .trim();
}

function ScoreGauge({ score }: { score: number }) {
  const r = 54;
  const circ = 2 * Math.PI * r;
  const pct = Math.min(100, Math.max(0, score));
  const offset = circ - (pct / 100) * circ;

  return (
    <div className="scoreGauge anim-scale-in">
      <svg viewBox="0 0 128 128" className="scoreGaugeRing">
        <circle cx="64" cy="64" r={r} className="gaugeTrack" />
        <circle
          cx="64"
          cy="64"
          r={r}
          className="gaugeFill"
          strokeDasharray={circ}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="scoreGaugeValue">
        <strong className="anim-fade-in">{score}</strong>
        <span>점</span>
      </div>
    </div>
  );
}

export default function HomePage({ me, isLoggedIn, onRequestLogin }: Props) {
  const [narrative, setNarrative] = useState<HomeNarrativeSnapshot | null>(null);
  const [luckScore, setLuckScore] = useState(() => calculateDailyFortuneSnapshot(me).scores.total);

  useEffect(() => {
    let alive = true;
    const fallbackFortune = calculateDailyFortuneSnapshot(me);
    setLuckScore(fallbackFortune.scores.total);

    calculateSajuResult(me)
      .then((result) => {
        if (!alive) return;
        setNarrative(buildMockHomeNarrative(me, result.providerState, { saju: result }));
        setLuckScore(buildDailyFortuneSnapshotFromProfile(result.profile).scores.total);
      })
      .catch(() => {
        if (!alive) return;
        setNarrative(buildMockHomeNarrative(me, "mock"));
        setLuckScore(fallbackFortune.scores.total);
      });

    return () => {
      alive = false;
    };
  }, [me]);

  const summary = useMemo<[string, string, string]>(() => {
    if (!narrative?.todaySummary || narrative.todaySummary.length < 3) return defaultSummary;

    const [line1, line2, line3] = narrative.todaySummary;
    return [line1 || defaultSummary[0], line2 || defaultSummary[1], line3 || defaultSummary[2]];
  }, [narrative]);

  const heroLead = narrative?.heroLead || defaultHeroLead;
  const heroSupport = narrative?.heroSupport || defaultHeroSupport;

  const points = {
    conversation: narrative?.todayPoints?.conversation || defaultPoints.conversation,
    wealth: narrative?.todayPoints?.wealth || defaultPoints.wealth,
    caution: narrative?.todayPoints?.caution || defaultPoints.caution,
  };

  const timeFlow = {
    morning: narrative?.timeFlow?.morning || defaultTimeFlow.morning,
    afternoon: narrative?.timeFlow?.afternoon || defaultTimeFlow.afternoon,
    evening: narrative?.timeFlow?.evening || defaultTimeFlow.evening,
  };

  const heroHeadline = useMemo(() => simplifyHeroLead(heroLead), [heroLead]);

  if (!narrative) {
    return (
      <PageLayout title="" subtitle="">
        <div className="homeHero skeleton" style={{ minHeight: "280px", marginBottom: "var(--space-4)" }} />
        <div className="skeleton homeSummaryCard" style={{ height: "160px", marginTop: "var(--space-4)" }} />
      </PageLayout>
    );
  }

  return (
    <PageLayout title="" subtitle="">
      {!isLoggedIn ? (
        <section className="homeMemberCard anim-fade-in">
          <div>
            <strong>로그인하면 오늘 결과와 궁합 기록을 저장할 수 있어요</strong>
            <p>지금 보는 결과를 저장하고 나중에 다시 이어볼 수 있어요.</p>
          </div>
          <button type="button" className="homeMemberBtn" onClick={onRequestLogin}>
            로그인 연결하기
          </button>
        </section>
      ) : null}

      <section className="homeHero anim-slide-up">
        <div className="homeHeroBackdrop" aria-hidden>
          <span className="homeHeroGlow homeHeroGlowOne" />
          <span className="homeHeroGlow homeHeroGlowTwo" />
          <span className="homeHeroConstellation" />
        </div>
        <div className="homeHeroInner">
          <div className="homeHeroTopline">
            <span className="homeHeroKicker">오늘의 사주 브리프</span>
          </div>

          <p className="homeHeroGreeting">{me.name}님의 오늘</p>

          <div className="homeHeroBody">
            <div className="homeHeroScorePanel">
              <ScoreGauge score={luckScore} />
              <div className="homeHeroScoreCopy">
                <small>오늘의 흐름</small>
                <strong>{heroHeadline}</strong>
                <p>{heroSupport}</p>
              </div>
            </div>

            <aside className="homeHeroReport">
              <small>오늘의 리포트</small>
              <strong>{summary[0]}</strong>
              <div className="homeHeroSignalRow">
                <span>{summary[1]}</span>
                <span>{summary[2]}</span>
              </div>
            </aside>
          </div>

          <div className="homeHeroActions">
            <Link to="/mysaju" className="homeHeroCta">
              내 사주 상세 보기
            </Link>
          </div>
        </div>
      </section>

      <section className="homeDigestCard anim-fade-in anim-delay-2">
        <div className="homeDigestHeader">
          <span className="homeSectionEyebrow">오늘 먼저 보기</span>
          <strong>{summary[0]}</strong>
          <p>{summary[1]}</p>
        </div>

        <div className="homeDigestRows">
          <article className="homeDigestRow">
            <small>대화운</small>
            <p>{points.conversation}</p>
          </article>
          <article className="homeDigestRow">
            <small>재물 포인트</small>
            <p>{points.wealth}</p>
          </article>
          <article className="homeDigestRow">
            <small>주의 포인트</small>
            <p>{points.caution}</p>
          </article>
        </div>

        <div className="homeFlowInline">
          <article className="homeFlowItem">
            <span>오전</span>
            <strong>정리</strong>
            <p>{timeFlow.morning}</p>
          </article>
          <article className="homeFlowItem">
            <span>오후</span>
            <strong>집중</strong>
            <p>{timeFlow.afternoon}</p>
          </article>
          <article className="homeFlowItem">
            <span>저녁</span>
            <strong>관계</strong>
            <p>{timeFlow.evening}</p>
          </article>
        </div>

        <Link to="/fortune" className="homeDigestLink">
          운세 흐름 더 보기
          <span className="ctaArrow">→</span>
        </Link>
      </section>

      <section className="homeExploreSection anim-fade-in anim-delay-5">
        <div className="homeSectionHead">
          <span className="homeSectionEyebrow">다음 탐색</span>
          <strong>오늘 흐름에서 더 보고 싶은 카드</strong>
        </div>
        <div className="homeExploreDeck">
          <Link to="/compatibility" className="homeExploreCard compatibility">
            <span className="homeExploreOverline">Explore</span>
            <strong>나와 잘 맞는 인연 흐름 보기</strong>
            <p>어떤 타입과 잘 맞고 어디서 부딪히는지 가볍게 읽어볼 수 있어요.</p>
            <span className="homeExploreArrow">궁합 열기 →</span>
          </Link>
          <Link to="/persona" className="homeExploreCard persona">
            <span className="homeExploreOverline">Persona</span>
            <strong>내 매력이 살아나는 관계 장면 보기</strong>
            <p>가까워질수록 드러나는 내 매력 포인트를 카드처럼 볼 수 있어요.</p>
            <span className="homeExploreArrow">페르소나 열기 →</span>
          </Link>
        </div>
      </section>
    </PageLayout>
  );
}
