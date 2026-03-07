import ResultCard from '../../components/ResultCard/ResultCard';
import { calculateSaju } from '../../lib/sajuEngine';
import type { UserProfileInput } from '../../types/saju';

type Props = {
  user: UserProfileInput;
};

export default function MySajuPage({ user }: Props) {
  const result = calculateSaju(user);
  const elements = Object.entries(result.fiveElements);

  return (
    <div className="page-grid">
      <h2>내 사주</h2>
      <p className="sub">오행 밸런스와 연애 성향 요약</p>

      <section className="element-card">
        {elements.map(([key, value]) => (
          <div key={key} className="element-row">
            <div>
              <strong>{key}</strong>
            </div>
            <div className="bar-wrap">
              <span className="bar-fill" style={{ width: `${value}%` }} />
            </div>
            <small>{value}</small>
          </div>
        ))}
      </section>

      <ResultCard title="성격 요약" items={[result.personalitySummary]} />
      <ResultCard title="연애 스타일" items={[result.loveStyle]} />
      <ResultCard title="이상형 특징" items={result.idealPartnerTraits} />
    </div>
  );
}
