import { useMemo, useState } from 'react';
import SwipeCard from '../../components/SwipeCard/SwipeCard';
import { mockProfiles } from '../../data/mockProfiles';

export default function HomePage() {
  const [index, setIndex] = useState(0);
  const current = useMemo(() => mockProfiles[index], [index]);

  return (
    <div className="page-grid">
      <h2>오늘의 운명 카드</h2>
      <p className="sub">좌우로 선택하며 인연을 탐색해보세요.</p>

      {current ? (
        <SwipeCard
          profile={current}
          onPass={() => setIndex((prev) => prev + 1)}
          onLike={() => setIndex((prev) => prev + 1)}
        />
      ) : (
        <section className="empty-card">더 이상 남은 카드가 없어요. 내일 다시 확인해요 ✨</section>
      )}
    </div>
  );
}
