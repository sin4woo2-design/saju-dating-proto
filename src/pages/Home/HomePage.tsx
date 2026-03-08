import { useMemo, useState } from "react";
import PageLayout from "../../components/layout/PageLayout";
import SwipeCard from "../../components/SwipeCard/SwipeCard";
import { mockMatchCards } from "../../data/mockProfiles";
import { useSwipeActions } from "../../hooks/useSwipeActions";
import { genderLabels } from "../../constants/labels";
import type { UserProfileInput } from "../../types/saju";

function findNextUnseenIndex(start: number, actions: Record<string, "like" | "pass">) {
  for (let i = start; i < mockMatchCards.length; i += 1) {
    if (!actions[mockMatchCards[i].id]) return i;
  }
  return -1;
}

interface Props {
  me: UserProfileInput;
}

export default function HomePage({ me }: Props) {
  const { actions, likedCount, passedCount, setLike, setPass, clearAll } = useSwipeActions();
  const [index, setIndex] = useState(() => findNextUnseenIndex(0, actions));
  const card = index >= 0 ? mockMatchCards[index] : null;

  const progress = useMemo(() => `${Math.min(index + 1, mockMatchCards.length)} / ${mockMatchCards.length}`, [index]);
  const average = useMemo(
    () => Math.round(mockMatchCards.reduce((sum, v) => sum + v.compatibility, 0) / mockMatchCards.length),
    []
  );

  const remain = useMemo(
    () => Math.max(0, mockMatchCards.length - Object.keys(actions).length),
    [actions]
  );

  const handlePass = () => {
    if (!card) return;
    setPass(card.id);
    const next = findNextUnseenIndex(index + 1, { ...actions, [card.id]: "pass" });
    setIndex(next);
  };

  const handleLike = () => {
    if (!card) return;
    setLike(card.id);
    const next = findNextUnseenIndex(index + 1, { ...actions, [card.id]: "like" });
    setIndex(next);
  };

  return (
    <PageLayout
      title="오늘의 인연 카드"
      subtitle="스와이프하면서 궁합이 맞는 인연 후보를 확인해 보세요."
      action={<span className="smallPill">{progress}</span>}
    >
      <section className="profileSummary">
        <strong>{me.name}님의 입력 정보</strong>
        <small>{me.birthDate} · {me.birthTime} · {genderLabels[me.gender]}</small>
      </section>

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
          <strong>{remain}명</strong>
          <span>남은 카드</span>
        </article>
      </section>

      <section className="quickStats quickStatsSecondary">
        <article>
          <strong>{likedCount}명</strong>
          <span>관심 보냄</span>
        </article>
        <article>
          <strong>{passedCount}명</strong>
          <span>패스</span>
        </article>
      </section>

      {!card ? (
        <section className="emptyState">
          <p>오늘 확인할 카드를 모두 봤어요 ✨</p>
          <button
            type="button"
            onClick={() => {
              clearAll();
              setIndex(0);
            }}
          >
            다시 보기
          </button>
        </section>
      ) : (
        <SwipeCard
          card={card}
          onPass={handlePass}
          onLike={handleLike}
        />
      )}
    </PageLayout>
  );
}
