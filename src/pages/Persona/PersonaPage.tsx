import { useEffect, useMemo, useState } from "react";
import PageLayout from "../../components/layout/PageLayout";
import { mockPersona } from "../../data/mockProfiles";
import { useTransientMessage } from "../../hooks/useTransientMessage";
import { calculatePersonaNarrativeWithEngine, type PersonaNarrativeSnapshot } from "../../lib/engine";
import { shareOrCopy } from "../../lib/share";

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
  appealPoint: "궁합 포인트 · 대화의 온도를 맞추면 매력이 더 강하게 드러나요.",
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
      appealPoint: narrative.appealPoint || fallbackNarrative.appealPoint,
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
    `state=${stateLabel(provenance.providerState)}`,
    `source=${provenance.chartSource || "mock"}`,
    `rule=${provenance.ruleVersion || "persona-v2"}`,
    `fallback=${provenance.isFallback ? "Y" : "N"}`,
  ].join(" · ");

  const handleShare = async () => {
    const result = await shareOrCopy({
      title: "내 운명의 이상형 결과",
      text: `${resolved.personaTitle}\n성격: ${localizePersonaText(resolved.personaTraits.personality)}\n직업군: ${localizePersonaText(resolved.personaTraits.career)}`,
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
          <h3>{resolved.personaTitle}</h3>
          <p className="personaSubcopy">{resolved.personaSubtitle}</p>
        </div>

        <ul className="personaFacts">
          <li><strong>연령대</strong> <span>{resolved.personaTraits.ageRange}</span></li>
          <li><strong>성격</strong> <span>{localizePersonaText(resolved.personaTraits.personality)}</span></li>
          <li><strong>직업군</strong> <span>{localizePersonaText(resolved.personaTraits.career)}</span></li>
          <li><strong>인상</strong> <span>{localizePersonaText(resolved.personaTraits.appearance)}</span></li>
        </ul>

        <div className="personaSignals">
          <span>{resolved.dominantElement}</span>
          <span>{resolved.supportElement}</span>
        </div>

        <p className="personaAppeal">{resolved.appealPoint}</p>
        <p className="personaAppeal">해석 기준 · {resolved.basisLabel}</p>
        <p style={{ marginTop: 2, fontSize: 11, opacity: 0.62 }}>QA · {provenanceLine}</p>

        <div className="personaBottom">
          <button type="button" className="shareBtn posterCta" onClick={handleShare}>결과 공유하기</button>
        </div>
      </article>
      {message ? <p className="toastText">{message}</p> : null}
    </PageLayout>
  );
}
