import type { DatingProfile } from '../../types/saju';
import './SwipeCard.css';

type Props = {
  profile: DatingProfile;
  onPass: () => void;
  onLike: () => void;
};

export default function SwipeCard({ profile, onPass, onLike }: Props) {
  return (
    <article className="swipe-card">
      <img src={profile.image} alt={profile.name} className="swipe-image" />

      <div className="swipe-body">
        <h3>
          {profile.name}, {profile.age}
        </h3>
        <p className="score">궁합 지수 {profile.score}</p>
        <p>{profile.summary}</p>

        <div className="tag-list">
          {profile.tags.map((tag) => (
            <span key={tag}>#{tag}</span>
          ))}
        </div>
      </div>

      <div className="swipe-actions">
        <button type="button" onClick={onPass}>
          PASS
        </button>
        <button type="button" className="primary" onClick={onLike}>
          LIKE
        </button>
      </div>
    </article>
  );
}
