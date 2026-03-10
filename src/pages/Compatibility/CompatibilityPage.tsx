import { useMemo, useState } from "react";
import ResultCard from "../../components/ResultCard/ResultCard";
import PageLayout from "../../components/layout/PageLayout";
import { genderLabels } from "../../constants/labels";
import { useTransientMessage } from "../../hooks/useTransientMessage";
import { calculateCompatibilityResult, generateCompatibilitySummary } from "../../lib/compatibility";
import { buildCompatibilityNarratives } from "../../lib/resultNarratives";
import { shareOrCopy } from "../../lib/share";
import type { Gender, UserProfileInput } from "../../types/saju";
import type { CompatibilityRawSignal } from "../../lib/engine/provider-contract";

interface Props {
  me: UserProfileInput;
}

function warningLabel(code: string) {
  if (code.includes("PARTIAL")) return "부분 데이터";
  if (code.includes("TIMEOUT")) return "지연 발생";
  if (code.includes("UNAVAILABLE")) return "연결 불가";
  return code;
}

function statusText(providerState: "mock" | "provider" | "mock-fallback", warnings: string[]) {
  if (providerState === "mock") {
    return {
      badge: "mock 모드",
      detail: "현재는 데모 계산으로 궁합을 보여주고 있어요.",
      tone: "fallback",
    } as const;
  }
  if (providerState === "mock-fallback") {
    return {
      badge: "fallback 사용",
      detail: "실계산 연결이 불안정해 백업 규칙으로 안내 중이에요.",
      tone: "fallback",
    } as const;
  }
  if (warnings.some((w) => w.includes("PARTIAL"))) {
    return {
      badge: "일부 보정됨",
      detail: "출생정보 일부가 없어 해석 정확도는 조금 낮아질 수 있어요.",
      tone: "warn",
    } as const;
  }
  return {
    badge: "실계산 사용",
    detail: "실제 궁합 신호를 반영한 결과예요.",
    tone: "ok",
  } as const;
}

function confidenceBadge(conf?: "high" | "medium" | "low") {
  if (conf === "high") return { label: "신뢰도 높음", guide: "서로의 시간 정보가 충분해 해석 안정감이 높아요.", tone: "ok" as const };
  if (conf === "medium") return { label: "신뢰도 보통", guide: "핵심 흐름은 유효하지만 일부 값은 보정되었어요.", tone: "warn" as const };
  return { label: "신뢰도 참고", guide: "출생시간 미상 등으로 큰 흐름 중심으로 봐주세요.", tone: "fallback" as const };
}

const signalDictionary: Record<string, { label: string; desc: string }> = {
  BRANCH_HAP_YEAR: { label: "연지 합", desc: "기본 성향과 생활 감각이 잘 맞아 초반 친밀도가 빨라요." },
  BRANCH_CHUNG_YEAR: { label: "연지 충", desc: "생활 리듬이 달라 사소한 습관에서 충돌이 날 수 있어요." },
  STEM_HAP_DAY: { label: "일간 합", desc: "서로의 핵심 성향이 맞물려 감정 교류가 자연스러워요." },
  STEM_CHUNG_DAY: { label: "일간 충", desc: "중요한 가치관에서 방향이 달라 논쟁이 커질 수 있어요." },
  ELEMENT_GENERATES_MUTUAL: { label: "오행 상생", desc: "강점이 서로를 북돋우는 흐름이라 회복력이 좋은 편이에요." },
  ELEMENT_CONTROLS_IMBALANCED: { label: "오행 상극", desc: "주도권/표현 방식 차이로 피로감이 누적될 수 있어요." },
  DAYMASTER_SUPPORT_MUTUAL: { label: "일간 보완", desc: "서로의 부족한 부분을 메워주는 안정형 궁합 신호예요." },
  DAYMASTER_CLASH: { label: "일간 충돌", desc: "해석 방식이 달라 같은 사건도 다르게 받아들일 수 있어요." },
  RELIABILITY_TIME_UNKNOWN_ME: { label: "내 시간 미상", desc: "내 출생시간이 없어 일부 신호 정확도가 낮아져요." },
  RELIABILITY_TIME_UNKNOWN_PARTNER: { label: "상대 시간 미상", desc: "상대 출생시간 정보 부족으로 세부 해석이 축약됐어요." },
  RELIABILITY_PARTIAL_PILLARS: { label: "부분 기둥", desc: "일부 기둥 정보가 제한되어 핵심 흐름 중심으로 계산됐어요." },
};

function signalLabel(code: string) {
  return signalDictionary[code]?.label ?? code;
}

function signalDescription(code: string) {
  return signalDictionary[code]?.desc ?? "해당 신호는 관계 상호작용 패턴을 보여주는 보조 지표예요.";
}

export default function CompatibilityPage({ me }: Props) {
  const [birthDate, setBirthDate] = useState("");
  const [birthTime, setBirthTime] = useState("");
  const [gender, setGender] = useState<Gender>("other");
  const [score, setScore] = useState<number | null>(null);
  const [providerState, setProviderState] = useState<"mock" | "provider" | "mock-fallback">("mock");
  const [warnings, setWarnings] = useState<string[]>([]);
  const [rawSignals, setRawSignals] = useState<CompatibilityRawSignal[]>([]);
  const [confidence, setConfidence] = useState<"high" | "medium" | "low">("low");
  const [isCalculating, setIsCalculating] = useState(false);
  const [selectedSignal, setSelectedSignal] = useState<string | null>(null);
  const { message, showMessage } = useTransientMessage();

  const isValid = useMemo(() => !!birthDate && !!birthTime, [birthDate, birthTime]);

  const onCalculate = async () => {
    if (!isValid) return;

    setIsCalculating(true);
    try {
      const result = await calculateCompatibilityResult(
        { birthDate: me.birthDate, birthTime: me.birthTime, gender: me.gender },
        { birthDate, birthTime, gender },
      );
      setScore(result.score);
      setProviderState(result.providerState);
      setWarnings(result.warnings ?? []);
      setRawSignals(result.rawSignals ?? []);
      setConfidence(result.reliability?.confidence ?? "low");
      setSelectedSignal(null);
    } catch {
      showMessage("궁합 계산에 실패했어요. 잠시 후 다시 시도해 주세요.");
    } finally {
      setIsCalculating(false);
    }
  };

  const summary = score !== null ? generateCompatibilitySummary(score) : null;
  const state = statusText(providerState, warnings);
  const layers = score !== null ? buildCompatibilityNarratives(score) : null;
  const confidenceInfo = confidenceBadge(confidence);

  const evidenceSignals = rawSignals
    .filter((s) => s.category !== "reliability")
    .slice(0, 6);

  const reliabilitySignals = rawSignals
    .filter((s) => s.category === "reliability")
    .slice(0, 3);

  const selectedSignalDescription = selectedSignal ? signalDescription(selectedSignal) : null;

  const handleShare = async () => {
    if (score === null || !summary) return;
    const result = await shareOrCopy({
      title: "우리 궁합 점수",
      text: `사주 궁합 ${score}점\n강점: ${summary.strengths.join(", ")}`,
    });

    showMessage(result === "shared" ? "공유 완료!" : "복사 완료! 원하는 곳에 붙여넣어 공유해보세요.");
  };

  return (
    <PageLayout title="궁합 보기" subtitle="핵심 점수 먼저 보고, 아래에서 근거 신호를 눌러 자세히 보세요.">
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

        <button type="button" className="shareBtn" disabled={!isValid || isCalculating} onClick={onCalculate}>
          {isCalculating ? "궁합 읽는 중..." : "궁합 계산하기"}
        </button>
      </section>

      {summary && layers && (
        <>
          <section className="heroCard">
            <div className="providerStatusRow">
              <span className={`sourceBadge ${state.tone === "ok" ? "ok" : state.tone === "warn" ? "warn" : "fallback"}`}>
                {state.badge}
              </span>
              <span className={`sourceBadge ${confidenceInfo.tone}`}>{confidenceInfo.label}</span>
              {warnings.slice(0, 2).map((w) => (
                <span key={w} className="warnBadge">{warningLabel(w)}</span>
              ))}
            </div>
            <div className="scoreHero">
              <div className="scoreBadge">
                <strong>{score}</strong>
                <span>/ 100</span>
              </div>
              <div>
                <h3>전체 궁합 점수</h3>
                <p className="statusHint">{state.detail}</p>
                <p className="statusHint">{confidenceInfo.guide}</p>
              </div>
            </div>
          </section>

          <section className="signalPanel">
            <h3 className="sectionTitle">핵심 근거 신호</h3>
            <div className="signalChips">
              {evidenceSignals.length ? evidenceSignals.map((s) => (
                <button
                  key={`${s.code}-${s.category}`}
                  type="button"
                  className={`signalChip ${selectedSignal === s.code ? "active" : ""}`}
                  onClick={() => setSelectedSignal((prev) => prev === s.code ? null : s.code)}
                >
                  {signalLabel(s.code)}
                </button>
              )) : <span className="subtitle">근거 신호 준비 중이거나 fallback 결과예요.</span>}
            </div>
            {selectedSignalDescription ? <p className="signalDesc">{selectedSignalDescription}</p> : null}
            {reliabilitySignals.length ? (
              <p className="statusHint">참고 신호: {reliabilitySignals.map((s) => signalLabel(s.code)).join(" · ")}</p>
            ) : null}
          </section>

          <ResultCard title="대화 궁합" tone="highlight" rows={[`대화 궁합 ${layers.talk}점`, "질문-확인-합의 순서를 쓰면 장점이 더 선명해져요."]} />
          <ResultCard title="감정 궁합" rows={[`감정 궁합 ${layers.emotion}점`, "감정 표현 온도 차이를 미리 맞추면 오해가 줄어요."]} />
          <ResultCard title="생활 궁합" rows={[`생활 궁합 ${layers.lifestyle}점`, "연락 리듬과 일정 합의를 먼저 잡아두면 안정감이 커져요."]} />

          <details className="foldSection" open>
            <summary>갈등 포인트</summary>
            <ResultCard title="주의 포인트" rows={layers.conflict} />
          </details>

          <details className="foldSection" open>
            <summary>관계 팁</summary>
            <ResultCard title="관계 팁" rows={layers.tips} />
          </details>

          <details className="foldSection">
            <summary>강점 & 한 줄 요약</summary>
            <ResultCard title="강점 포인트" tone="highlight" rows={summary.strengths.map((v) => `✅ ${v}`)} />
            <ResultCard title="관계 주의 한마디" rows={summary.cautions.map((v) => `⚠️ ${v}`)} />
          </details>

          <button type="button" className="ghostBtn" onClick={handleShare}>결과 공유</button>
          {message ? <p className="toastText">{message}</p> : null}
        </>
      )}
    </PageLayout>
  );
}
