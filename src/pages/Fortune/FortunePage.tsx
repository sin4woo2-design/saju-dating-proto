import PageLayout from "../../components/layout/PageLayout";
import { calculateDailyFortuneScores } from "../../lib/dailyFortune";
import type { UserProfileInput } from "../../types/saju";

interface Props {
  me: UserProfileInput;
}

export default function FortunePage({ me }: Props) {
  const score = calculateDailyFortuneScores(me);

  return (
    <PageLayout title="오늘 운세" subtitle="매일 확인하기 좋은 가벼운 운세 피드예요.">
      <section className="heroCard signatureCard">
        <h3>오늘의 총운 {score.total}점</h3>
        <p className="statusHint">큰 결정보다는 리듬 정리와 커뮤니케이션 정돈이 잘 맞는 날이에요.</p>
      </section>

      <section className="homeHubGrid">
        <article className="hubCard summaryCard">
          <strong>💘 연애운</strong>
          <p>{score.love}점 · 빠른 결론보다 공감형 대화가 더 유리해요.</p>
        </article>
        <article className="hubCard summaryCard">
          <strong>📚 일·학업운</strong>
          <p>{score.work}점 · 오늘은 한 번에 하나씩 정리하면 효율이 올라가요.</p>
        </article>
        <article className="hubCard summaryCard">
          <strong>🫧 컨디션운</strong>
          <p>{score.health}점 · 휴식 타이밍을 미리 넣어두면 리듬이 안정돼요.</p>
        </article>
      </section>

      <section className="hubCard utilityCard">
        <strong>✅ 오늘의 추천 액션</strong>
        <p>• 연락은 짧고 명확하게
          <br />• 일정은 여유 10% 남기기
          <br />• 감정이 올라오면 한 템포 쉬고 말하기
        </p>
      </section>
    </PageLayout>
  );
}
