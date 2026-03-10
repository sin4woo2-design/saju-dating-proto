import PageLayout from "../../components/layout/PageLayout";
import type { UserProfileInput } from "../../types/saju";

interface Props {
  me: UserProfileInput;
}

function makeFortune(me: UserProfileInput) {
  const seed = `${me.birthDate}-${me.birthTime}-${new Date().toISOString().slice(0, 10)}`
    .split("")
    .reduce((acc, ch) => acc + ch.charCodeAt(0), 0);

  const total = 62 + (seed % 34);
  const love = 55 + (seed % 40);
  const work = 50 + ((seed * 3) % 42);
  const health = 58 + ((seed * 5) % 36);

  return { total, love: Math.min(98, love), work: Math.min(98, work), health: Math.min(98, health) };
}

export default function FortunePage({ me }: Props) {
  const score = makeFortune(me);

  return (
    <PageLayout title="오늘 운세" subtitle="오늘 하루에 맞춘 가벼운 가이드예요.">
      <section className="heroCard">
        <h3>오늘의 종합 운세 {score.total}점</h3>
        <p className="statusHint">큰 결정보다는 리듬 정리가 잘 맞는 날이에요.</p>
      </section>

      <section className="quickStats">
        <article>
          <strong>{score.love}</strong>
          <span>연애운</span>
        </article>
        <article>
          <strong>{score.work}</strong>
          <span>일·학업운</span>
        </article>
        <article>
          <strong>{score.health}</strong>
          <span>컨디션운</span>
        </article>
      </section>

      <section className="hubCard">
        <strong>오늘의 추천 액션</strong>
        <p>1) 연락은 짧고 명확하게
          <br />2) 일정은 여유 10% 남기기
          <br />3) 감정이 올라오면 한 템포 쉬고 말하기
        </p>
      </section>
    </PageLayout>
  );
}
