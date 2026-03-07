import { useState } from "react";
import ResultCard from "../../components/ResultCard/ResultCard";
import { elementLabels } from "../../constants/labels";
import { calculateSaju } from "../../lib/sajuEngine";
import { shareOrCopy } from "../../lib/share";
import type { UserProfileInput } from "../../types/saju";

interface Props {
  me: UserProfileInput;
}

export default function MySajuPage({ me }: Props) {
  const profile = calculateSaju(me);
  const [shareMessage, setShareMessage] = useState("");

  const handleShare = async () => {
    const result = await shareOrCopy({
      title: `${me.name}님의 사주 요약`,
      text: `${profile.personalitySummary}\n연애 스타일: ${profile.loveStyle}`,
    });
    setShareMessage(result === "shared" ? "공유 완료!" : "복사 완료! 원하는 곳에 붙여넣어 공유해보세요.");
    setTimeout(() => setShareMessage(""), 2200);
  };

  return (
    <div className="pageWrap">
      <div className="sectionHead">
        <h2>{me.name}님의 사주 리포트</h2>
        <button type="button" className="ghostBtn" onClick={handleShare}>공유</button>
      </div>

      <section className="elementCard">
        {Object.entries(profile.fiveElements).map(([key, value]) => (
          <div key={key} className="barRow">
            <strong>{elementLabels[key] ?? key}</strong>
            <div className="barTrack"><i style={{ width: `${value}%` }} /></div>
            <span>{value}</span>
          </div>
        ))}
      </section>

      <ResultCard title="핵심 성향" rows={[profile.personalitySummary]} tone="highlight" />
      <ResultCard title="연애 스타일" rows={[profile.loveStyle]} />
      <ResultCard title="잘 맞는 상대 특징" rows={profile.idealTraits} />
      {shareMessage ? <p className="toastText">{shareMessage}</p> : null}
    </div>
  );
}
