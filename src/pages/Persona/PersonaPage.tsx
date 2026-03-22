import { useEffect, useMemo, useState } from "react";
import PageLayout from "../../components/layout/PageLayout";
import { useTransientMessage } from "../../hooks/useTransientMessage";
import { usePersistedProfile } from "../../hooks/usePersistedProfile";
import { calculatePersonaNarrativeWithEngine, type PersonaNarrativeSnapshot } from "../../lib/engine";
import { shareOrCopy } from "../../lib/share";
import "./PersonaPage.css";

const fallbackNarrative: PersonaNarrativeSnapshot = {
  providerState: "mock",
  personaTitle: "정서 공명 조율형",
  personaSubtitle: "상대 반응을 먼저 읽고 호흡을 맞출수록 매력이 더 또렷해지는 타입이에요.",
  personaTraits: {
    relationTempo: "빠르게 끌어당기기보다 대화 온도를 맞추며 가까워질 때 안정감이 커져요.",
    attractionStyle: "부드러운 반응과 상대 흐름을 읽는 말투가 가장 큰 매력 포인트예요.",
    stableRhythm: "감정 확인이 가능한 대화와 예측 가능한 연락 간격에서 마음이 훨씬 편해져요.",
    cautionPoint: "상대 반응에만 맞추다 보면 내 페이스를 놓칠 수 있어서 먼저 내 리듬부터 챙기는 편이 좋아요.",
  },
  dominantElement: "강한 기운 · 화(火)",
  supportElement: "보완 기운 · 수(水)",
  appealPoint: "대화 온도를 맞출 때 매력이 가장 분명하게 드러나요.",
  basisLabel: "기본 mock 해석",
  basisCodes: ["MOCK_PERSONA_V1"],
  confidence: "low",
  ruleVersion: "persona-v3",
  provenance: {
    providerState: "mock",
    chartSource: "mock",
    ruleVersion: "persona-v3",
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

function stateLabel(providerState?: string) {
  if (providerState === "provider") return "PROVIDER";
  if (providerState === "mock-fallback") return "MOCK-FALLBACK";
  return "MOCK";
}

export default function PersonaPage() {
  const { message, showMessage } = useTransientMessage();
  const { profile } = usePersistedProfile();
  const [narrative, setNarrative] = useState<PersonaNarrativeSnapshot | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const input = profile
      ? {
          name: profile.name,
          birthDate: profile.birthDate,
          birthTime: profile.birthTime,
          gender: profile.gender,
        }
      : {
          name: "사용자",
          birthDate: "1990-01-01",
          birthTime: "12:00",
          gender: "male" as const,
        };

    let alive = true;
    setIsLoading(true);

    calculatePersonaNarrativeWithEngine(input)
      .then((result) => {
        if (alive) setNarrative(result);
      })
      .catch(() => {
        if (alive) setNarrative(null);
      })
      .finally(() => {
        if (alive) setIsLoading(false);
      });

    return () => {
      alive = false;
    };
  }, [profile?.name, profile?.birthDate, profile?.birthTime, profile?.gender]);

  const resolved = useMemo(() => {
    if (!narrative) return fallbackNarrative;

    return {
      ...fallbackNarrative,
      ...narrative,
      personaTitle: narrative.personaTitle || fallbackNarrative.personaTitle,
      personaSubtitle: narrative.personaSubtitle || fallbackNarrative.personaSubtitle,
      personaTraits: {
        relationTempo: narrative.personaTraits?.relationTempo || fallbackNarrative.personaTraits.relationTempo,
        attractionStyle: narrative.personaTraits?.attractionStyle || fallbackNarrative.personaTraits.attractionStyle,
        stableRhythm: narrative.personaTraits?.stableRhythm || fallbackNarrative.personaTraits.stableRhythm,
        cautionPoint: narrative.personaTraits?.cautionPoint || fallbackNarrative.personaTraits.cautionPoint,
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
    ruleVersion: "persona-v3",
    isFallback: true,
  };

  const provenanceLine = [
    `${stateLabel(provenance.providerState)}`,
    `${provenance.chartSource || "mock"}`,
    `v:${provenance.ruleVersion || "v3"}`,
  ].join(" · ");

  const handleShare = async () => {
    const result = await shareOrCopy({
      title: "사주 라운지 · 나의 페르소나",
      text: `${resolved.personaTitle}\n관계 템포: ${resolved.personaTraits.relationTempo}\n매력 축: ${resolved.appealPoint}`,
    });

    showMessage(result === "shared" ? "공유 완료!" : "복사 완료! 원하는 SNS에 붙여넣어 보세요.");
  };

  return (
    <PageLayout title="나의 페르소나" subtitle="내가 관계에서 어떤 인상과 리듬을 만드는지 보는 카드예요.">
      <div className="personaLayout anim-slide-up">
        {isLoading ? (
          <div className="personaPosterWrapper">
            <div className="personaGlowBg" />
            <article className="personaPosterCard">
              <div className="posterInnerBorder" style={{ textAlign: "center", padding: "3rem 1.25rem" }}>
                <span className="posterOverline">My Persona</span>
                <h3 className="posterTitle" style={{ marginTop: "0.5rem" }}>나의 페르소나 분석 중…</h3>
                <p className="posterSubtitle">실데이터를 불러오는 중이에요. 잠시만 기다려 주세요.</p>
              </div>
            </article>
          </div>
        ) : (
          <>
            {/* ── Outer glowing wrapper ── */}
            <div className="personaPosterWrapper">
              <div className="personaGlowBg" />

              <article className="personaPosterCard">
                <div className="posterInnerBorder">

                  <div className="posterHeader">
                    <span className="posterOverline">My Persona</span>
                    <h3 className="posterTitle">{resolved.personaTitle}</h3>
                    <p className="posterSubtitle">{resolved.personaSubtitle}</p>
                  </div>

                  <div className="posterTraits">
                    <div className="traitRow">
                      <strong>관계 템포</strong>
                      <span>{resolved.personaTraits.relationTempo}</span>
                    </div>
                    <div className="traitRow">
                      <strong>매력 축</strong>
                      <span>{resolved.personaTraits.attractionStyle}</span>
                    </div>
                    <div className="traitRow">
                      <strong>편한 리듬</strong>
                      <span>{resolved.personaTraits.stableRhythm}</span>
                    </div>
                    <div className="traitRow">
                      <strong>주의 포인트</strong>
                      <span>{resolved.personaTraits.cautionPoint}</span>
                    </div>
                  </div>

                  <div className="posterElements">
                    <span className="badge fire">{resolved.dominantElement}</span>
                    <span className="badge water">{resolved.supportElement}</span>
                  </div>

                  <div className="posterFooter">
                    <div className="footerDivider" />
                    <p className="appealPoint">
                      <strong>나의 매력 포인트</strong>
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
          </>
        )}
      </div>
      
      {message && <p className="toastMsg anim-slide-up">{message}</p>}
    </PageLayout>
  );
}
