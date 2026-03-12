import PageLayout from "../../components/layout/PageLayout";
import { calculateDailyFortuneScores } from "../../lib/dailyFortune";
import type { UserProfileInput } from "../../types/saju";
import "./FortunePage.css";

interface Props {
  me: UserProfileInput;
}

export default function FortunePage({ me }: Props) {
  const score = calculateDailyFortuneScores(me);

  return (
    <PageLayout title="오늘 운세" subtitle="매일 확인하기 좋은 가벼운 운세 피드예요.">
      
      {/* ── HERO ── */}
      <section className="fortuneHero anim-slide-up">
        <div className="fortuneHeroInner">
          <span className="fortuneHeroLabel">오늘의 총운</span>
          <div className="fortuneScoreWrap">
            <strong className="fortuneScore">{score.total}</strong>
            <span className="fortuneUnit">점</span>
          </div>
          <p className="fortuneHeroDesc">큰 결정보다는 리듬 정리와 커뮤니케이션 정돈이 잘 맞는 날이에요.</p>
        </div>
      </section>

      {/* ── DETAIL SCORES ── */}
      <section className="fortuneDetailsGrid anim-fade-in anim-delay-1">
        <article className="ftDetailCard love">
          <div className="ftCardHead">
            <span className="ftIcon">💘</span>
            <strong>연애운</strong>
            <span className="ftScore">{score.love}점</span>
          </div>
          <p>빠른 결론보다 공감형 대화가 더 유리해요.</p>
        </article>

        <article className="ftDetailCard work">
          <div className="ftCardHead">
            <span className="ftIcon">📚</span>
            <strong>일·학업운</strong>
            <span className="ftScore">{score.work}점</span>
          </div>
          <p>오늘은 한 번에 하나씩 정리하면 효율이 올라가요.</p>
        </article>

        <article className="ftDetailCard health">
          <div className="ftCardHead">
            <span className="ftIcon">🫧</span>
            <strong>컨디션운</strong>
            <span className="ftScore">{score.health}점</span>
          </div>
          <p>휴식 타이밍을 미리 넣어두면 리듬이 안정돼요.</p>
        </article>
      </section>

      {/* ── ACTION LIST ── */}
      <section className="fortuneActionCard anim-fade-in anim-delay-2">
        <div className="actionHeader">
          <span className="actionIcon">✅</span>
          <strong>오늘의 추천 액션</strong>
        </div>
        <ul className="actionList">
          <li>연락은 짧고 명확하게</li>
          <li>일정은 여유 10% 남기기</li>
          <li>감정이 올라오면 한 템포 쉬고 말하기</li>
        </ul>
      </section>

    </PageLayout>
  );
}
