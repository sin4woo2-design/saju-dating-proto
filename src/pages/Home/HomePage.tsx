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
              <ul className="homeHeroReportList">
                <li>{summary[1]}</li>
                <li>{summary[2]}</li>
              </ul>
            </aside>
          </div>

          <div className="homeHeroActions">
            <Link to="/mysaju" className="homeHeroCta">
              내 사주 상세 보기
            </Link>
          </div>
        </div>
      </section>

      <section className="homeApproachCard anim-fade-in anim-delay-2">
        <span className="homeApproachEyebrow">지금 잘 맞는 접근</span>
        <strong>{points.conversation}</strong>
        <p>{points.caution}</p>
        <small>오후엔 {timeFlow.afternoon}</small>
        <Link to="/fortune" className="homeSpotlightLink">
          운세 흐름 더 보기
          <span className="ctaArrow">→</span>
        </Link>
      </section>

      <section className="homePoints anim-fade-in anim-delay-3">
        <h5>오늘의 포인트</h5>
        <div className="homePointsList">
          <div className="homePointItem">
            <span className="pointDot conversation" />
            <div>
              <strong>대화운</strong>
              <p>{points.conversation}</p>
            </div>
          </div>
          <div className="homePointItem">
            <span className="pointDot wealth" />
            <div>
              <strong>재물 포인트</strong>
              <p>{points.wealth}</p>
            </div>
          </div>
          <div className="homePointItem">
            <span className="pointDot caution" />
            <div>
              <strong>주의 포인트</strong>
              <p>{points.caution}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="homeTimeFlow anim-fade-in anim-delay-4">
        <h5>시간대별 흐름</h5>
        <div className="homeTimeGrid">
          <article className="timeCard morning">
            <small>오전</small>
            <b>정리</b>
            <p>{timeFlow.morning}</p>
          </article>
          <article className="timeCard afternoon">
            <small>오후</small>
            <b>집중</b>
            <p>{timeFlow.afternoon}</p>
          </article>
          <article className="timeCard evening">
            <small>저녁</small>
            <b>관계</b>
            <p>{timeFlow.evening}</p>
          </article>
        </div>
      </section>

      <section className="homeExploreDeck anim-fade-in anim-delay-5">
        <Link to="/compatibility" className="homeExploreCard compatibility">
          <span className="homeExploreOverline">Explore</span>
          <strong>나와 잘 맞는 인연 흐름 보기</strong>
          <p>궁합 신호를 보면 어떤 타입과 부딪히고 어떤 관계가 편한지 더 빨리 읽혀요.</p>
          <span className="homeExploreArrow">궁합 열기 →</span>
        </Link>
        <Link to="/persona" className="homeExploreCard persona">
          <span className="homeExploreOverline">Persona</span>
          <strong>내 매력이 살아나는 관계 장면 보기</strong>
          <p>첫인상보다 가까워질수록 드러나는 매력 포인트를 카드처럼 가볍게 확인해 보세요.</p>
          <span className="homeExploreArrow">페르소나 열기 →</span>
        </Link>
      </section>
    </PageLayout>
  );
}
