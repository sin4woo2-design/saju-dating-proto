import { useState } from 'react';
import ResultCard from '../../components/ResultCard/ResultCard';
import { calculateCompatibility } from '../../lib/compatibility';
import type { Gender, UserProfileInput } from '../../types/saju';

const defaultPartner = {
  birthDate: '',
  birthTime: '',
  gender: 'other' as Gender,
};

type Props = {
  user: UserProfileInput;
};

export default function CompatibilityPage({ user }: Props) {
  const [partner, setPartner] = useState(defaultPartner);
  const [result, setResult] = useState<ReturnType<typeof calculateCompatibility> | null>(null);

  const onSubmit = () => {
    if (!partner.birthDate || !partner.birthTime) return;
    setResult(calculateCompatibility(user.birthDate, user.birthTime, partner));
  };

  return (
    <div className="page-grid">
      <h2>궁합 보기</h2>
      <p className="sub">두 사람의 생년월일/시간으로 궁합을 확인해요.</p>

      <section className="form-card">
        <input
          type="date"
          value={partner.birthDate}
          onChange={(e) => setPartner((prev) => ({ ...prev, birthDate: e.target.value }))}
        />
        <input
          type="time"
          value={partner.birthTime}
          onChange={(e) => setPartner((prev) => ({ ...prev, birthTime: e.target.value }))}
        />
        <select
          value={partner.gender}
          onChange={(e) => setPartner((prev) => ({ ...prev, gender: e.target.value as Gender }))}
        >
          <option value="male">male</option>
          <option value="female">female</option>
          <option value="other">other</option>
        </select>
        <button type="button" onClick={onSubmit}>
          궁합 계산
        </button>
      </section>

      {result && (
        <>
          <section className="score-card">
            <p>궁합 점수</p>
            <h3>{result.score}</h3>
            <p>{result.summary}</p>
          </section>
          <ResultCard title="관계 강점" items={result.strengths} />
          <ResultCard title="주의할 점" items={result.cautions} />
        </>
      )}
    </div>
  );
}
