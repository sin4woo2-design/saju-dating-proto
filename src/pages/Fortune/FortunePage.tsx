import { useEffect, useMemo, useState } from "react";
import PageLayout from "../../components/layout/PageLayout";
import { buildDailyFortuneSnapshotFromProfile, calculateDailyFortuneSnapshot, type DailyFortuneSnapshot } from "../../lib/dailyFortune";
import { calculateSajuResult } from "../../lib/sajuEngine";
import { elementLabel } from "../../lib/sajuAnalysis";
import type { UserProfileInput } from "../../types/saju";
import "./FortunePage.css";

interface Props {
  me: UserProfileInput;
}

export default function FortunePage({ me }: Props) {
  const [snapshot, setSnapshot] = useState<DailyFortuneSnapshot | null>(null);

  useEffect(() => {
    let alive = true;
    const fallback = calculateDailyFortuneSnapshot(me);
    setSnapshot(fallback);

    calculateSajuResult(me)
      .then((result) => {
        if (!alive) return;
        setSnapshot(buildDailyFortuneSnapshotFromProfile(result.profile));
      })
      .catch(() => {
        if (alive) setSnapshot(fallback);
      });

    return () => {
      alive = false;
    };
  }, [me]);

  const resolved = useMemo(() => snapshot ?? calculateDailyFortuneSnapshot(me), [me, snapshot]);

  return (
    <PageLayout title="오늘 운세" subtitle="오늘 들어오는 기운을 명식 기준으로 가볍게 풀어봤어요.">
      <section className="fortuneHero anim-slide-up">
        <div className="fortuneHeroInner">
          <span className="fortuneHeroLabel">오늘의 테마 · {elementLabel(resolved.themeElement)}</span>
          <div className="fortuneScoreWrap">
            <strong className="fortuneScore">{resolved.scores.total}</strong>
            <span className="fortuneUnit">점</span>
          </div>
          <p className="fortuneHeroDesc">{resolved.heroLead}</p>
          <p className="fortuneHeroSub">{resolved.heroSupport}</p>
        </div>
      </section>

      <section className="fortuneDetailsGrid anim-fade-in anim-delay-1">
        <article className="ftDetailCard love">
          <div className="ftCardHead">
            <span className="ftIcon">💘</span>
            <strong>관계운</strong>
            <span className="ftScore">{resolved.scores.love}점</span>
          </div>
          <p>{resolved.loveMessage}</p>
        </article>

        <article className="ftDetailCard work">
          <div className="ftCardHead">
            <span className="ftIcon">📚</span>
            <strong>일·학업운</strong>
            <span className="ftScore">{resolved.scores.work}점</span>
          </div>
          <p>{resolved.workMessage}</p>
        </article>

        <article className="ftDetailCard health">
          <div className="ftCardHead">
            <span className="ftIcon">🫧</span>
            <strong>컨디션운</strong>
            <span className="ftScore">{resolved.scores.health}점</span>
          </div>
          <p>{resolved.healthMessage}</p>
        </article>
      </section>

      <section className="fortuneActionCard anim-fade-in anim-delay-2">
        <div className="actionHeader">
          <span className="actionIcon">✅</span>
          <strong>오늘의 추천 액션</strong>
        </div>
        <ul className="actionList">
          {resolved.actionItems.map((item, index) => (
            <li key={`${resolved.dateKey}-${index}`}>{item}</li>
          ))}
        </ul>
        <p className="fortuneCaution">{resolved.cautionLine}</p>
      </section>
    </PageLayout>
  );
}
