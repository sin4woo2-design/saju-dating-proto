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
          <p className="heroMicroLabel plain">오늘의 운세</p>
          <div className="heroScoreOrb compact luxe">
            <strong>{luckScore}</strong>
            <span>점</span>
          </div>
        </div>

        <h3>{me.name}님의 오늘 흐름</h3>
        <p className="heroDescLine">{todayLine}</p>
        <p className="heroConclusion">관계 조율과 대화 정리가 운의 흐름을 더 좋게 만들어요.</p>

        <Link to="/fortune" className="heroInlineCta heroGoldCta">오늘 운세 자세히 보기</Link>
      </section>

      <section className="homeHubGrid homeTripletGrid">
        <article className="metricCard premiumMetricCard">
          <strong>◷</strong>
          <p className="metricLabel">집중 시간</p>
          <b>2 - 4 PM</b>
        </article>
        <article className="metricCard premiumMetricCard">
          <strong>◔</strong>
          <p className="metricLabel">관계 온도</p>
          <b>75°C</b>
        </article>
        <article className="metricCard premiumMetricCard">
          <strong>⌘</strong>
          <p className="metricLabel">오늘의 키워드</p>
          <b>화합</b>
        </article>
      </section>

      <section className="dailySummarySection premiumSummarySection">
        <h4>오늘의 운세 요약</h4>
        <ul className="dailySummaryList">
          <li>중요한 대화를 시작하기 좋은 흐름이에요.</li>
          <li>{me.name}님은 강한 기운을 보완하는 톤 선택이 핵심이에요.</li>
          <li>가까운 관계 조율에서 좋은 결과가 기대돼요.</li>
        </ul>
        <Link to="/mysaju" className="summaryFullCta">사주 전체 분석 보기</Link>
      </section>

      <section className="hubCard utilityCard continueCard homeContinueCard promoContinueCard">
        <strong>⏱️ 이어보기</strong>
        <p>최근 보던 흐름으로 바로 돌아가세요.</p>
        <div className="continueLinks">
          <Link to="/compatibility" className="continuePrimaryLink">궁합 계산 이어보기</Link>
          <Link to="/persona" className="continueSecondaryLink">페르소나 카드 보기</Link>
        </div>
      </section>
    </PageLayout>
  );
}
