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
      <header className="swipeHead">
        <div className="avatar">{card.name[0]}</div>
        <div>
          <h3>{card.name}, {card.age}</h3>
          <p className="meta">{card.location} · {card.mbti}</p>
        </div>
        <span className="scorePill">{card.compatibility}%</span>
      </header>

      <p className="intro">{card.intro}</p>
      <p className="note">{card.note}</p>

      <div className="tags">
        {card.tags.map((tag) => <span key={tag}>#{tag}</span>)}
      </div>

      <div className="swipeActions">
        <button type="button" className="ghost" onClick={onPass}>패스</button>
        <button type="button" className="like" onClick={onLike}>관심 보내기</button>
      </div>
    </article>
  );
}
