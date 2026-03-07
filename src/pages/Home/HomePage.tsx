import { useState } from "react";
import SwipeCard from "../../components/SwipeCard/SwipeCard";
import { mockMatchCards } from "../../data/mockProfiles";

export default function HomePage() {
  const [index, setIndex] = useState(0);
  const card = mockMatchCards[index];

  return (
    <div className="pageWrap">
      <h2>오늘의 인연 카드</h2>
      {!card ? (
        <p className="subtitle">오늘 확인할 카드를 모두 봤어. 내일 다시 열어봐 ✨</p>
      ) : (
        <SwipeCard card={card} onPass={() => setIndex((v) => v + 1)} onLike={() => setIndex((v) => v + 1)} />
      )}
    </div>
  );
}
