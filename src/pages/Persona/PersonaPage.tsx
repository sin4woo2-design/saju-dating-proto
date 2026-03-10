import PageLayout from "../../components/layout/PageLayout";
import { mockPersona } from "../../data/mockProfiles";
import { useTransientMessage } from "../../hooks/useTransientMessage";
import { shareOrCopy } from "../../lib/share";

function localizePersonaText(value: string) {
  return value
    .replace(/Warm Strategist/gi, "따뜻한 전략가형")
    .replace(/Design\s*\/\s*Product\s*\/\s*Creative/gi, "기획·디자인·창작형")
    .replace(/Calm\s*\/\s*Intellectual/gi, "차분하고 지적인 인상");
}

export default function PersonaPage() {
  const { message, showMessage } = useTransientMessage();

  const handleShare = async () => {
    const result = await shareOrCopy({
      title: "내 운명의 이상형 결과",
      text: `${mockPersona.title}\n성격: ${localizePersonaText(mockPersona.personality)}\n직업군: ${localizePersonaText(mockPersona.career)}`,
    });

    showMessage(result === "shared" ? "공유 완료!" : "복사 완료! 원하는 SNS에 붙여넣어 보세요.");
  };

  return (
    <PageLayout title="운명의 이상형 페르소나" subtitle="캡처하고 공유하기 좋은 포스터 카드예요.">
      <article className="personaCard posterCard signatureCard">
        <div className="posterGlow" />
        <div className="posterGlow secondary" />
        <div className="posterRing" aria-hidden />

        <div className="personaTop">
          <h3>{mockPersona.title}</h3>
          <p className="personaSubcopy">부드러운 공감력과 현실 감각이 함께 작동하는 관계형 페르소나예요.</p>
        </div>

        <ul className="personaFacts">
          <li><strong>연령대</strong> <span>{mockPersona.ageRange}</span></li>
          <li><strong>성격</strong> <span>{localizePersonaText(mockPersona.personality)}</span></li>
          <li><strong>직업군</strong> <span>{localizePersonaText(mockPersona.career)}</span></li>
          <li><strong>인상</strong> <span>{localizePersonaText(mockPersona.appearance)}</span></li>
        </ul>

        <div className="personaSignals">
          <span>강한 기운 · 화(火)</span>
          <span>보완 기운 · 수(水)</span>
        </div>

        <p className="personaAppeal">궁합 포인트 · 대화의 온도를 맞추면 매력이 더 강하게 드러나요.</p>

        <div className="personaBottom">
          <button type="button" className="shareBtn posterCta" onClick={handleShare}>결과 공유하기</button>
        </div>
      </article>
      {message ? <p className="toastText">{message}</p> : null}
    </PageLayout>
  );
}
