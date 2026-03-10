import { Link } from "react-router-dom";
import PageLayout from "../../components/layout/PageLayout";
import { genderLabels } from "../../constants/labels";
import type { UserProfileInput } from "../../types/saju";

interface Props {
  me: UserProfileInput;
}

function dailySeed(me: UserProfileInput) {
  const today = new Date().toISOString().slice(0, 10);
  return `${me.birthDate}-${me.birthTime}-${today}`.split("").reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
}

const fortuneLevels = ["매우 좋음", "좋음", "보통", "집중 필요"] as const;

export default function HomePage({ me }: Props) {
  const seed = dailySeed(me);
  const luckScore = 60 + (seed % 36);
  const luckLevel = fortuneLevels[Math.min(3, Math.floor((96 - luckScore) / 10))] ?? "보통";

  const todayLine = [
    "작은 루틴을 지키면 큰 흐름이 따라오는 날이에요.",
    "감정 표현을 한 템포만 천천히 하면 관계가 부드러워져요.",
    "오늘은 결론보다 대화의 분위기를 먼저 챙겨보세요.",
    "가벼운 약속 하나가 좋은 기회를 만들 수 있어요.",
  ][seed % 4];

  return (
    <PageLayout title="오늘의 사주 홈" subtitle="오늘의 흐름을 먼저 보고, 필요한 리포트로 바로 이어가세요.">
      <section className="heroCard homeHeroVisual signatureCard posterHero">
        <div className="heroWave" />
        <div className="heroOrbit" aria-hidden />

        <div className="heroCenterTop">
          <p className="smallBadge">✨ 오늘의 기운</p>
          <div className="heroScoreOrb">
            <strong>{luckScore}</strong>
            <span>{luckLevel}</span>
          </div>
        </div>

        <h3>{me.name}님의 오늘 사주 흐름</h3>
        <p className="statusHint">{todayLine}</p>
        <p className="heroMetaLine">행동 포인트 · 중요한 이야기는 저녁 전에 정리해보세요.</p>
        <p className="heroSubLine">{me.birthDate} · {me.birthTime} · {genderLabels[me.gender]}</p>

        <Link to="/fortune" className="heroInlineCta heroPrimaryCta">오늘 운세 자세히 보기</Link>
      </section>

      <section className="homeHubGrid homeTripletGrid">
        <article className="hubCard summaryCard">
          <strong>집중 타이밍</strong>
          <p>17:00 ~ 20:00</p>
        </article>
        <article className="hubCard summaryCard">
          <strong>관계 온도</strong>
          <p>차분한 대화가 유리해요.</p>
        </article>
        <article className="hubCard summaryCard">
          <strong>오늘 키워드</strong>
          <p>리듬 정리</p>
        </article>
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
