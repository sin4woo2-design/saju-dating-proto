import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import PageLayout from "../../components/layout/PageLayout";
import { calculateHomeNarrativeWithEngine, type HomeNarrativeSnapshot } from "../../lib/engine";
import type { UserProfileInput } from "../../types/saju";

interface Props {
  me: UserProfileInput;
}

function dailySeed(me: UserProfileInput) {
  const today = new Date().toISOString().slice(0, 10);
  return `${me.birthDate}-${me.birthTime}-${today}`.split("").reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
}

const defaultHeroLead = "오늘은 대화의 시작 톤이 흐름을 만듭니다.";
const defaultHeroSupport = "첫 문장을 부드럽게 열면 반응이 편안해져요.";

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

export default function HomePage({ me }: Props) {
  const seed = dailySeed(me);
  const luckScore = 60 + (seed % 36);
  const [narrative, setNarrative] = useState<HomeNarrativeSnapshot | null>(null);

  useEffect(() => {
    let alive = true;

    calculateHomeNarrativeWithEngine(me)
      .then((result) => {
        if (alive) setNarrative(result);
      })
      .catch(() => {
        if (alive) setNarrative(null);
      });

    return () => {
      alive = false;
    };
  }, [me.birthDate, me.birthTime, me.gender]);

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

  return (
    <PageLayout title="" subtitle="">
      <section className="heroCard homeHeroVisual signatureCard refHeroCard compactHeroCard heroRefined heroLuxury heroReferenceCard">
        <p className="heroScoreChip">{luckScore}점</p>

        <div className="heroPaperFrame">
          <div className="heroSunMark" aria-hidden>
            <i />
            <span />
          </div>
          <p className="heroPaperLabel">오늘의 운세</p>
          <h3>{me.name}님의 오늘 흐름</h3>
          <p className="heroDescLine">{heroLead}</p>
          <p className="heroConclusion">{heroSupport}</p>
        </div>

        <Link to="/mysaju" className="heroInlineCta heroGoldCta full">내 사주 상세 보기</Link>
      </section>

      <section className="homeHubGrid homeTripletGrid">
        <article className="metricCard premiumMetricCard">
          <strong>◷</strong>
          <p className="metricLabel">집중 시간</p>
          <b>2-4 PM</b>
        </article>
        <article className="metricCard premiumMetricCard">
          <strong>◔</strong>
          <p className="metricLabel">관계 온도</p>
          <b>75°C</b>
        </article>
        <article className="metricCard premiumMetricCard">
          <strong>⌘</strong>
          <p className="metricLabel">키워드</p>
          <b>화합</b>
        </article>
      </section>

      <section className="dailySummarySection premiumSummarySection summaryCardBlock">
        <h4>오늘의 운세 요약</h4>
        <ul className="dailySummaryList">
          <li>{summary[0]}</li>
          <li>{summary[1]}</li>
          <li>{summary[2]}</li>
        </ul>
        <Link to="/fortune" className="summaryFullCta">운세 더 보기</Link>
      </section>

      <section className="microInfoBlock">
        <h5>오늘의 포인트</h5>
        <ul>
          <li><strong>대화운</strong><span>{points.conversation}</span></li>
          <li><strong>재물 포인트</strong><span>{points.wealth}</span></li>
          <li><strong>주의 포인트</strong><span>{points.caution}</span></li>
        </ul>
      </section>

      <section className="timeFlowBlock">
        <h5>시간대별 흐름</h5>
        <div className="timeFlowRow">
          <article><small>오전</small><b>정리</b><p>{timeFlow.morning}</p></article>
          <article><small>오후</small><b>집중</b><p>{timeFlow.afternoon}</p></article>
          <article><small>저녁</small><b>조율</b><p>{timeFlow.evening}</p></article>
        </div>
      </section>

      <section className="hubCard utilityCard continueCard homeContinueCard promoContinueCard">
        <small className="continueLabel">최근 본 항목</small>
        <strong>⏱️ 이어보기</strong>
        <p>보던 흐름으로 바로 돌아가세요.</p>
        <div className="continueLinks row inlineLinks">
          <Link to="/compatibility" className="continuePrimaryLink">궁합 보기</Link>
          <Link to="/persona" className="continuePrimaryLink secondary">페르소나 보기</Link>
        </div>
      </section>
    </PageLayout>
  );
}
