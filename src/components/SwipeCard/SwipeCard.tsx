import type { MatchCard } from "../../types/saju";
import "./SwipeCard.css";

interface Props {
  card: MatchCard;
  onPass: () => void;
  onLike: () => void;
}

export default function SwipeCard({ card, onPass, onLike }: Props) {
  return (
    <article className="swipeCard">
      <div className="avatar">{card.name[0]}</div>
      <h3>{card.name}, {card.age}</h3>
      <p className="score">궁합 지수 {card.compatibility}</p>
      <p className="note">{card.note}</p>
      <div className="tags">
        {card.tags.map((tag) => <span key={tag}>#{tag}</span>)}
      </div>
      <div className="swipeActions">
        <button type="button" onClick={onPass}>왼쪽 패스</button>
        <button type="button" className="like" onClick={onLike}>오른쪽 관심</button>
      </div>
    </article>
  );
}
