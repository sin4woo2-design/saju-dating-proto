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
      <section className="heroCard homeHeroVisual signatureCard refHeroCard">
        <div className="refHeroHead">
          <div>
            <p className="smallBadge">오늘의 운세</p>
            <h3>최고의 하루</h3>
          </div>
          <div className="heroScoreOrb">
            <strong>{luckScore}</strong>
            <span>점</span>
          </div>
        </div>

        <p className="statusHint">{todayLine}</p>
        <div className="refHighlightBox">✦ 금전운과 애정운이 조화롭게 작용하고 있어요.</div>
      </section>

      <section className="homeHubGrid homeTripletGrid">
        <article className="metricCard">
          <strong>◷</strong>
          <p className="metricLabel">집중 시간</p>
          <b>2 - 4 PM</b>
        </article>
        <article className="metricCard">
          <strong>◔</strong>
          <p className="metricLabel">관계 온도</p>
          <b>75°C</b>
        </article>
        <article className="metricCard">
          <strong>⌘</strong>
          <p className="metricLabel">오늘의 키워드</p>
          <b>화합</b>
        </article>
      </section>

      <section className="dailySummarySection">
        <h4>오늘의 운세 요약</h4>
        <ul>
          <li>오늘은 중요한 대화를 시작하기 좋은 흐름이에요.</li>
          <li>{me.name}님의 강한 기운을 보완하는 톤을 선택해보세요.</li>
          <li>가까운 사람과의 관계 조율에서 좋은 결과가 기대돼요.</li>
        </ul>
        <Link to="/mysaju" className="summaryFullCta">사주 전체 분석 보기</Link>
      </section>

      <section className="hubCard utilityCard continueCard">
        <strong>⏱️ 이어보기</strong>
        <p>최근 보던 화면으로 바로 돌아가세요.</p>
        <div className="continueLinks">
          <Link to="/compatibility">궁합 계산 이어보기</Link>
          <span className="heroSubLine"><Link to="/persona">페르소나 카드 보기</Link></span>
        </div>
      </section>
    </PageLayout>
  );
}
