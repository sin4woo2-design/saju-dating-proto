import { Link } from "react-router-dom";
import PageLayout from "../../components/layout/PageLayout";
import type { UserProfileInput } from "../../types/saju";

interface Props {
  me: UserProfileInput;
}

function dailySeed(me: UserProfileInput) {
  const today = new Date().toISOString().slice(0, 10);
  return `${me.birthDate}-${me.birthTime}-${today}`.split("").reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
}

export default function HomePage({ me }: Props) {
  const seed = dailySeed(me);
  const luckScore = 60 + (seed % 36);

  const todayLine = [
    "작은 루틴을 지키면 큰 흐름이 따라오는 날이에요.",
    "감정 표현을 한 템포만 천천히 하면 관계가 부드러워져요.",
    "오늘은 결론보다 대화의 분위기를 먼저 챙겨보세요.",
    "가벼운 약속 하나가 좋은 기회를 만들 수 있어요.",
  ][seed % 4];

  return (
    <PageLayout title="" subtitle="">
      <section className="heroCard homeHeroVisual signatureCard refHeroCard compactHeroCard heroRefined heroLuxury">
        <div className="heroAura" aria-hidden />
        <div className="heroWave" />
        <div className="heroOrbit" aria-hidden />

        <div className="refHeroHead">
          <div className="heroTitleWrap">
            <p className="heroMicroLabel plain">오늘의 운세</p>
            <h3>{me.name}님의 오늘 흐름</h3>
          </div>
          <div className="heroScoreOrb compact luxe">
            <strong>{luckScore}점</strong>
          </div>
        </div>

        <p className="heroDescLine">{todayLine}</p>
        <p className="heroConclusion">대화의 톤을 먼저 맞추면 운이 더 부드럽게 열려요.</p>

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
          <li>중요한 대화 시작에 좋은 타이밍이에요.</li>
          <li>{me.name}님은 보완 톤 선택이 핵심이에요.</li>
          <li>관계 조율에서 좋은 흐름이 보여요.</li>
        </ul>
        <Link to="/fortune" className="summaryFullCta">운세 더 보기</Link>
      </section>

      <section className="microInfoBlock">
        <h5>오늘의 포인트</h5>
        <ul>
          <li><strong>대화운</strong><span>짧고 명확한 한 문장이 통하는 날이에요.</span></li>
          <li><strong>재물 포인트</strong><span>작은 지출은 저녁 전에 정리하면 좋아요.</span></li>
          <li><strong>주의 포인트</strong><span>감정 반응보다 일정 우선순위를 먼저 잡아보세요.</span></li>
        </ul>
      </section>

      <section className="timeFlowBlock">
        <h5>시간대별 흐름</h5>
        <div className="timeFlowRow">
          <article><small>오전</small><b>정리</b><p>가벼운 할 일부터 빠르게 처리</p></article>
          <article><small>오후</small><b>집중</b><p>핵심 업무/대화에 힘이 붙어요</p></article>
          <article><small>저녁</small><b>조율</b><p>관계 대화와 마무리 정리에 유리</p></article>
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
