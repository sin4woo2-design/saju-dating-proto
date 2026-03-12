import { useEffect, useMemo, useState } from "react";
import PageLayout from "../../components/layout/PageLayout";
import { mockPersona } from "../../data/mockProfiles";
import { useTransientMessage } from "../../hooks/useTransientMessage";
import { calculatePersonaNarrativeWithEngine, type PersonaNarrativeSnapshot } from "../../lib/engine";
import { shareOrCopy } from "../../lib/share";
import "./PersonaPage.css";

const fallbackNarrative: PersonaNarrativeSnapshot = {
  providerState: "mock",
  personaTitle: "따뜻한 전략가형",
  personaSubtitle: "부드러운 공감력과 현실 감각이 함께 작동하는 관계형 페르소나예요.",
  personaTraits: {
    ageRange: mockPersona.ageRange,
    personality: "따뜻하고 전략적인 성향",
    career: "기획·디자인·창작형",
    appearance: "차분하고 지적인 인상",
  },
  dominantElement: "강한 기운 · 화(火)",
  supportElement: "보완 기운 · 수(水)",
  appealPoint: "대화의 온도를 맞추면 매력이 더 강하게 드러나요.",
  basisLabel: "기본 mock 페르소나",
  basisCodes: ["MOCK_PERSONA_V1"],
  confidence: "low",
  ruleVersion: "persona-v2",
  provenance: {
    providerState: "mock",
    chartSource: "mock",
    ruleVersion: "persona-v2",
    isFallback: true,
  },
  basis: {
    dominantElement: "fire",
    supportElement: "water",
    personaTone: "warm",
    appealAxis: "emotion-sync",
    relationStyle: "strategist",
    basisCodes: ["MOCK_PERSONA_V1"],
  },
};

function localizePersonaText(value: string) {
  return value
    .replace(/Warm Strategist/gi, "따뜻한 전략가형")
    .replace(/Design\s*\/\s*Product\s*\/\s*Creative/gi, "기획·디자인·창작형")
    .replace(/Calm\s*\/\s*Intellectual/gi, "차분하고 지적인 인상");
}

function stateLabel(providerState?: string) {
  if (providerState === "provider") return "PROVIDER";
  if (providerState === "mock-fallback") return "MOCK-FALLBACK";
  return "MOCK";
}

export default function PersonaPage() {
  const { message, showMessage } = useTransientMessage();
  const [narrative, setNarrative] = useState<PersonaNarrativeSnapshot | null>(null);

  useEffect(() => {
    const fallbackInput = {
      name: "사용자",
      birthDate: "1990-01-01",
      birthTime: "12:00",
      gender: "male" as const,
    };

    let alive = true;

    calculatePersonaNarrativeWithEngine(fallbackInput)
      .then((result) => {
        if (alive) setNarrative(result);
      })
      .catch(() => {
        if (alive) setNarrative(null);
      });

    return () => {
      alive = false;
    };
  }, []);

  const resolved = useMemo(() => {
    if (!narrative) return fallbackNarrative;

    return {
      ...fallbackNarrative,
      ...narrative,
      personaTitle: narrative.personaTitle || fallbackNarrative.personaTitle,
      personaSubtitle: narrative.personaSubtitle || fallbackNarrative.personaSubtitle,
      personaTraits: {
        ageRange: narrative.personaTraits?.ageRange || fallbackNarrative.personaTraits.ageRange,
        personality: narrative.personaTraits?.personality || fallbackNarrative.personaTraits.personality,
        career: narrative.personaTraits?.career || fallbackNarrative.personaTraits.career,
        appearance: narrative.personaTraits?.appearance || fallbackNarrative.personaTraits.appearance,
      },
      dominantElement: narrative.dominantElement || fallbackNarrative.dominantElement,
      supportElement: narrative.supportElement || fallbackNarrative.supportElement,
      appealPoint: (narrative.appealPoint || fallbackNarrative.appealPoint).replace("궁합 포인트 · ", ""),
      basisLabel: narrative.basisLabel || fallbackNarrative.basisLabel,
      basisCodes: narrative.basisCodes?.length ? narrative.basisCodes : fallbackNarrative.basisCodes,
    };
  }, [narrative]);

  const provenance = resolved.provenance ?? {
    providerState: resolved.providerState ?? "mock",
    chartSource: "mock",
    ruleVersion: "persona-v2",
    isFallback: true,
  };

  const provenanceLine = [
    `${stateLabel(provenance.providerState)}`,
    `${provenance.chartSource || "mock"}`,
    `v:${provenance.ruleVersion || "v2"}`,
  ].join(" · ");

  const handleShare = async () => {
    const result = await shareOrCopy({
      title: "사주 라운지 · 운명의 이상형",
      text: `${resolved.personaTitle}\n성격: ${localizePersonaText(resolved.personaTraits.personality)}\n직업군: ${localizePersonaText(resolved.personaTraits.career)}`,
    });

    showMessage(result === "shared" ? "공유 완료!" : "복사 완료! 원하는 SNS에 붙여넣어 보세요.");
  };

  return (
    <PageLayout title="운명의 이상형 페르소나" subtitle="캡처해서 공유하기 좋은 포스터 카드예요.">
      <div className="personaLayout anim-slide-up">
        
        {/* ── Outer glowing wrapper ── */}
        <div className="personaPosterWrapper">
          <div className="personaGlowBg" />
          
          <article className="personaPosterCard">
            <div className="posterInnerBorder">
              
              <div className="posterHeader">
                <span className="posterOverline">Saju Lounge Persona</span>
                <h3 className="posterTitle">{resolved.personaTitle}</h3>
                <p className="posterSubtitle">{resolved.personaSubtitle}</p>
              </div>

              <div className="posterTraits">
                <div className="traitRow">
                  <strong>연령대</strong>
                  <span>{resolved.personaTraits.ageRange}</span>
                </div>
                <div className="traitRow">
                  <strong>성격</strong>
                  <span>{localizePersonaText(resolved.personaTraits.personality)}</span>
                </div>
                <div className="traitRow">
                  <strong>직업군</strong>
                  <span>{localizePersonaText(resolved.personaTraits.career)}</span>
                </div>
                <div className="traitRow">
                  <strong>인상</strong>
                  <span>{localizePersonaText(resolved.personaTraits.appearance)}</span>
                </div>
              </div>

              <div className="posterElements">
                <span className="badge fire">{resolved.dominantElement}</span>
                <span className="badge water">{resolved.supportElement}</span>
              </div>

              <div className="posterFooter">
                <div className="footerDivider" />
                <p className="appealPoint">
                  <strong>궁합 포인트</strong>
                  {resolved.appealPoint}
                </p>
                <div className="posterMeta">
                  <span>해석 기준: {resolved.basisLabel}</span>
                  <span className="qaLine">QA: {provenanceLine}</span>
                </div>
              </div>

            </div>
          </article>
        </div>

        <button type="button" className="personaShareBtn anim-fade-in anim-delay-2" onClick={handleShare}>
          결과 공유하기
        </button>

      </div>
      
      {message && <p className="toastMsg anim-slide-up">{message}</p>}
    </PageLayout>
  );
}
