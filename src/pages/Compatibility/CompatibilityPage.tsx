import { useState } from "react";
import ResultCard from "../../components/ResultCard/ResultCard";
import { calculateCompatibility, generateCompatibilitySummary } from "../../lib/compatibility";
import type { Gender, UserProfileInput } from "../../types/saju";

interface Props {
  me: UserProfileInput;
}

export default function CompatibilityPage({ me }: Props) {
  const [birthDate, setBirthDate] = useState("");
  const [birthTime, setBirthTime] = useState("");
  const [gender, setGender] = useState<Gender>("other");
  const [score, setScore] = useState<number | null>(null);

  const onCalculate = () => {
    const value = calculateCompatibility(
      { birthDate: me.birthDate, birthTime: me.birthTime, gender: me.gender },
      { birthDate, birthTime, gender },
    );
    setScore(value);
  };

  const summary = score !== null ? generateCompatibilitySummary(score) : null;

  return (
    <div className="pageWrap">
      <h2>궁합 보기</h2>
      <section className="formCard">
        <input type="date" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} />
        <input type="time" value={birthTime} onChange={(e) => setBirthTime(e.target.value)} />
        <select value={gender} onChange={(e) => setGender(e.target.value as Gender)}>
          <option value="male">male</option>
          <option value="female">female</option>
          <option value="other">other</option>
        </select>
        <button type="button" onClick={onCalculate}>궁합 계산</button>
      </section>

      {summary && (
        <>
          <ResultCard title={`궁합 점수 ${score}`} rows={[...summary.strengths.map((v) => `강점: ${v}`), ...summary.cautions.map((v) => `주의: ${v}`)]} />
        </>
      )}
    </div>
  );
}
