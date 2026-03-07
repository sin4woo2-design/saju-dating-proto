import { useMemo, useState } from "react";
import ResultCard from "../../components/ResultCard/ResultCard";
import { genderLabels } from "../../constants/labels";
import { calculateCompatibility, generateCompatibilitySummary } from "../../lib/compatibility";
import { shareOrCopy } from "../../lib/share";
import type { Gender, UserProfileInput } from "../../types/saju";

interface Props {
  me: UserProfileInput;
}

export default function CompatibilityPage({ me }: Props) {
  const [birthDate, setBirthDate] = useState("");
  const [birthTime, setBirthTime] = useState("");
  const [gender, setGender] = useState<Gender>("other");
  const [score, setScore] = useState<number | null>(null);
  const [shareMessage, setShareMessage] = useState("");

  const isValid = useMemo(() => !!birthDate && !!birthTime, [birthDate, birthTime]);

  const onCalculate = () => {
    if (!isValid) return;
    const value = calculateCompatibility(
      { birthDate: me.birthDate, birthTime: me.birthTime, gender: me.gender },
      { birthDate, birthTime, gender },
    );
    setScore(value);
  };

  const summary = score !== null ? generateCompatibilitySummary(score) : null;

  const handleShare = async () => {
    if (score === null) return;
    const result = await shareOrCopy({
      title: "우리 궁합 점수",
      text: `사주 궁합 점수 ${score}점\n강점: ${summary?.strengths.join(", ")}`,
    });

    setShareMessage(result === "shared" ? "공유 완료!" : "복사 완료! 원하는 곳에 붙여넣어 공유해보세요.");
    setTimeout(() => setShareMessage(""), 2200);
  };

  return (
    <div className="pageWrap">
      <h2>궁합 보기</h2>
      <section className="formCard">
        <label className="fieldLabel">
          상대 생년월일
          <input type="date" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} />
        </label>

        <label className="fieldLabel">
          상대 출생시간
          <input type="time" value={birthTime} onChange={(e) => setBirthTime(e.target.value)} />
        </label>

        <label className="fieldLabel">
          상대 성별
          <select value={gender} onChange={(e) => setGender(e.target.value as Gender)}>
            <option value="male">{genderLabels.male}</option>
            <option value="female">{genderLabels.female}</option>
            <option value="other">{genderLabels.other}</option>
          </select>
        </label>

        <button type="button" disabled={!isValid} onClick={onCalculate}>궁합 계산하기</button>
      </section>

      {summary && (
        <>
          <ResultCard
            title={`궁합 점수 ${score}점`}
            tone="highlight"
            rows={[
              ...summary.strengths.map((v) => `강점 · ${v}`),
              ...summary.cautions.map((v) => `주의 · ${v}`),
            ]}
          />
          <button type="button" className="ghostBtn" onClick={handleShare}>결과 공유</button>
          {shareMessage ? <p className="toastText">{shareMessage}</p> : null}
        </>
      )}
    </div>
  );
}
