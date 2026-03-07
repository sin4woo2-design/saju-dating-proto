import { useState } from "react";
import { mockPersona } from "../../data/mockProfiles";
import { shareOrCopy } from "../../lib/share";

export default function PersonaPage() {
  const [shareMessage, setShareMessage] = useState("");

  const handleShare = async () => {
    const result = await shareOrCopy({
      title: "내 운명의 이상형 결과",
      text: `${mockPersona.title}\n성격: ${mockPersona.personality}\n직업군: ${mockPersona.career}`,
    });

    setShareMessage(result === "shared" ? "공유 완료!" : "복사 완료! 원하는 SNS에 붙여넣어 보세요.");
    setTimeout(() => setShareMessage(""), 2200);
  };

  return (
    <div className="pageWrap">
      <h2>운명의 이상형 페르소나</h2>
      <article className="personaCard">
        <p className="badge">SHAREABLE RESULT</p>
        <h3>{mockPersona.title}</h3>
        <ul>
          <li><strong>연령대</strong> {mockPersona.ageRange}</li>
          <li><strong>성격</strong> {mockPersona.personality}</li>
          <li><strong>직업군</strong> {mockPersona.career}</li>
          <li><strong>인상</strong> {mockPersona.appearance}</li>
        </ul>
        <p className="hash">{mockPersona.hashtags.join(" ")}</p>
        <button type="button" className="shareBtn" onClick={handleShare}>결과 공유하기</button>
      </article>
      {shareMessage ? <p className="toastText">{shareMessage}</p> : null}
    </div>
  );
}
