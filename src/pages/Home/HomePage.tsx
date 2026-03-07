import { useMemo, useState } from "react";
import SwipeCard from "../../components/SwipeCard/SwipeCard";
import { mockMatchCards } from "../../data/mockProfiles";

export default function HomePage() {
  const [index, setIndex] = useState(0);
  const card = mockMatchCards[index];
  const progress = useMemo(() => `${Math.min(index + 1, mockMatchCards.length)} / ${mockMatchCards.length}`, [index]);

  return (
    <div className="pageWrap">
      <div className="sectionHead">
        <h2>오늘의 인연 카드</h2>
        <span className="smallPill">{progress}</span>
      </div>
      <p className="subtitle">스와이프하면서 궁합이 맞는 인연 후보를 확인해 보세요.</p>

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
    </div>
  );
}
