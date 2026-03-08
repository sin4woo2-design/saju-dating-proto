import { useMemo, useState } from "react";
import PageLayout from "../../components/layout/PageLayout";
import SwipeCard from "../../components/SwipeCard/SwipeCard";
import { mockMatchCards } from "../../data/mockProfiles";

export default function HomePage() {
  const [index, setIndex] = useState(0);
  const card = mockMatchCards[index];

  const progress = useMemo(() => `${Math.min(index + 1, mockMatchCards.length)} / ${mockMatchCards.length}`, [index]);
  const average = useMemo(
    () => Math.round(mockMatchCards.reduce((sum, v) => sum + v.compatibility, 0) / mockMatchCards.length),
    []
  );

  return (
    <PageLayout
      title="오늘의 인연 카드"
      subtitle="스와이프하면서 궁합이 맞는 인연 후보를 확인해 보세요."
      action={<span className="smallPill">{progress}</span>}
    >
      <section className="quickStats">
        <article>
          <strong>{mockMatchCards.length}명</strong>
          <span>오늘 추천</span>
        </article>
        <article>
          <strong>{average}%</strong>
          <span>평균 궁합</span>
        </article>
        <article>
          <strong>{Math.max(0, mockMatchCards.length - index)}명</strong>
          <span>남은 카드</span>
        </article>
      </section>

      {!card ? (
        <section className="emptyState">
          <p>오늘 확인할 카드를 모두 봤어요 ✨</p>
          <button type="button" onClick={() => setIndex(0)}>다시 보기</button>
        </section>
      ) : (
        <SwipeCard
          card={card}
          onPass={() => setIndex((v) => v + 1)}
          onLike={() => setIndex((v) => v + 1)}
        />
      )}
    </PageLayout>
  );
}
