import ResultCard from "../../components/ResultCard/ResultCard";
import { calculateSaju } from "../../lib/sajuEngine";
import type { UserProfileInput } from "../../types/saju";

interface Props {
  me: UserProfileInput;
}

export default function MySajuPage({ me }: Props) {
  const profile = calculateSaju(me);

  return (
    <div className="pageWrap">
      <h2>내 사주 보기</h2>
      <section className="elementCard">
        {Object.entries(profile.fiveElements).map(([key, value]) => (
          <div key={key} className="barRow">
            <strong>{key}</strong>
            <div className="barTrack"><i style={{ width: `${value}%` }} /></div>
            <span>{value}</span>
          </div>
        ))}
      </section>
      <ResultCard title="성격 요약" rows={[profile.personalitySummary]} />
      <ResultCard title="연애 스타일" rows={[profile.loveStyle]} />
      <ResultCard title="이상형 특징" rows={profile.idealTraits} />
    </div>
  );
}
