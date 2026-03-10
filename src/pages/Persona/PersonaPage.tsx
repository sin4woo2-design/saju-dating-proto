import PageLayout from "../../components/layout/PageLayout";
import { mockPersona } from "../../data/mockProfiles";
import { useTransientMessage } from "../../hooks/useTransientMessage";
import { shareOrCopy } from "../../lib/share";

export default function PersonaPage() {
  const { message, showMessage } = useTransientMessage();

  const handleShare = async () => {
    const result = await shareOrCopy({
      title: "내 운명의 이상형 결과",
      text: `${mockPersona.title}\n성격: ${mockPersona.personality}\n직업군: ${mockPersona.career}`,
    });

    showMessage(result === "shared" ? "공유 완료!" : "복사 완료! 원하는 SNS에 붙여넣어 보세요.");
  };

  return (
    <PageLayout title="운명의 이상형 페르소나" subtitle="캡처하고 공유하기 좋은 포스터 카드예요.">
      <article className="personaCard posterCard signatureCard">
        <div className="posterGlow" />
        <div className="posterStars">✦ ✧ ✦</div>
        <div className="posterRing" aria-hidden />

        <p className="badge">SHAREABLE RESULT</p>
        <p className="posterLead">운명의 취향 코드</p>
        <h3>{mockPersona.title}</h3>

        <ul>
          <li><strong>🕰️ 연령대</strong> {mockPersona.ageRange}</li>
          <li><strong>💬 성격</strong> {mockPersona.personality}</li>
          <li><strong>💼 직업군</strong> {mockPersona.career}</li>
          <li><strong>✨ 인상</strong> {mockPersona.appearance}</li>
        </ul>

        <p className="hash">{mockPersona.hashtags.join(" ")}</p>

        <div className="summaryChips personaChips">
          <span>저장용 카드</span>
          <span>지인 공유 추천</span>
        </div>

        <p className="posterCaption">오늘의 취향 코드를 한 장으로 정리한 결과예요. 스토리 캡처로 공유해보세요.</p>
        <button type="button" className="shareBtn posterCta" onClick={handleShare}>결과 공유하기</button>
      </article>
      {message ? <p className="toastText">{message}</p> : null}
    </PageLayout>
  );
}
