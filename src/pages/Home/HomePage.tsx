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
      <section className="heroCard homeHeroVisual signatureCard">
        <div className="heroWave" />
        <div className="heroOrbit" aria-hidden />

        <div className="homeHeroTop">
          <p className="smallBadge">✨ 오늘의 기운</p>
          <span className="smallPill">{luckScore}점</span>
        </div>

        <h3>{me.name}님의 오늘 운 흐름 · {luckLevel}</h3>
        <p className="statusHint">{todayLine}</p>

        <p className="heroMetaLine">
          집중 17:00-20:00 · 관계 온도 차분한 대화 · 키워드 리듬 정리
        </p>

        <p className="heroSubLine">{me.birthDate} · {me.birthTime} · {genderLabels[me.gender]}</p>

        <Link to="/fortune" className="heroInlineCta">오늘 운세 자세히 보기 →</Link>
      </section>

      <section className="homeHubGrid">
        <article className="hubCard summaryCard fortuneCard">
          <strong>📈 오늘 운세 요약</strong>
          <p>종합 점수 {luckScore}점 · 중요한 대화는 저녁 전에 마무리하면 좋아요.</p>
          <Link to="/fortune">자세히 보기</Link>
        </article>

        <article className="hubCard summaryCard recommendCard">
          <strong>🪄 추천 카드</strong>
          <p>내 사주의 강세/보완 포인트를 먼저 보고 오늘 행동 포인트를 정해보세요.</p>
          <Link to="/mysaju">내 사주 열기</Link>
        </article>
      </section>

      <section className="homeMenuChips">
        <Link to="/mysaju">🌙 원국 보기</Link>
        <Link to="/fortune">☀️ 오늘 운세</Link>
        <Link to="/persona">💌 페르소나 카드</Link>
        <Link to="/inyeon">🧭 인연 콘텐츠</Link>
      </section>

      <section className="hubCard utilityCard continueCard">
        <strong>⏱️ 이어보기</strong>
        <p>최근 많이 보는 리포트부터 다시 시작해보세요.</p>
        <div className="continueLinks">
          <Link to="/mysaju">내 사주 리포트 이어보기</Link>
          <Link to="/compatibility">궁합 계산 바로가기</Link>
        </div>
      </section>
    </PageLayout>
  );
}
