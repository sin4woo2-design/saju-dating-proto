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
  if (code.includes("TIMEOUT")) return "타임아웃";
  if (code.includes("UNAVAILABLE")) return "연결 불가";
  return code;
}

function statusText(providerState: "provider" | "mock-fallback", warnings: string[]) {
  if (providerState === "mock-fallback") {
    return {
      badge: "fallback 사용",
      detail: "현재는 백업 규칙으로 궁합 점수를 계산했어요.",
      tone: "fallback",
    } as const;
  }
  if (warnings.some((w) => w.includes("PARTIAL"))) {
    return {
      badge: "일부 보정됨",
      detail: "출생시간 미상/부분 데이터가 포함되어 해석 정확도가 낮아질 수 있어요.",
      tone: "warn",
    } as const;
  }
  return {
    badge: "실계산 사용",
    detail: "provider 계산 결과가 정상 반영된 점수예요.",
    tone: "ok",
  } as const;
}

function confidenceBadge(conf?: "high" | "medium" | "low") {
  if (conf === "high") return { label: "신뢰도 높음", tone: "ok" as const };
  if (conf === "medium") return { label: "신뢰도 보통", tone: "warn" as const };
  return { label: "신뢰도 낮음", tone: "fallback" as const };
}

function signalLabel(code: string) {
  const map: Record<string, string> = {
    BRANCH_HAP_YEAR: "연지 합",
    BRANCH_CHUNG_YEAR: "연지 충",
    STEM_HAP_DAY: "일간 합",
    STEM_CHUNG_DAY: "일간 충",
    ELEMENT_GENERATES_MUTUAL: "오행 상생",
    ELEMENT_CONTROLS_IMBALANCED: "오행 상극",
    DAYMASTER_SUPPORT_MUTUAL: "일간 보완",
    DAYMASTER_CLASH: "일간 충돌",
    RELIABILITY_TIME_UNKNOWN_ME: "내 시간 미상",
    RELIABILITY_TIME_UNKNOWN_PARTNER: "상대 시간 미상",
    RELIABILITY_PARTIAL_PILLARS: "부분 기둥",
  };
  return map[code] ?? code;
}

export default function CompatibilityPage({ me }: Props) {
  const [birthDate, setBirthDate] = useState("");
  const [birthTime, setBirthTime] = useState("");
  const [gender, setGender] = useState<Gender>("other");
  const [score, setScore] = useState<number | null>(null);
  const [providerState, setProviderState] = useState<"provider" | "mock-fallback">("mock-fallback");
  const [warnings, setWarnings] = useState<string[]>([]);
  const [rawSignals, setRawSignals] = useState<CompatibilityRawSignal[]>([]);
  const [confidence, setConfidence] = useState<"high" | "medium" | "low">("low");
  const [isCalculating, setIsCalculating] = useState(false);
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
    .slice(0, 5);
  const hasReliabilityRisk = rawSignals.some((s) => s.category === "reliability") || warnings.some((w) => w.includes("PARTIAL"));

  const handleShare = async () => {
    if (score === null) return;
    const result = await shareOrCopy({
      title: "우리 궁합 점수",
      text: `사주 궁합 점수 ${score}점\n강점: ${summary?.strengths.join(", ")}`,
    });

    showMessage(result === "shared" ? "공유 완료!" : "복사 완료! 원하는 곳에 붙여넣어 공유해보세요.");
  };

  return (
    <PageLayout title="궁합 보기" subtitle="상대 기본 정보로 오늘의 궁합 흐름을 확인해보세요.">
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

        <button type="button" disabled={!isValid || isCalculating} onClick={onCalculate}>
          {isCalculating ? "계산 중..." : "궁합 계산하기"}
        </button>
      </section>

      {summary && layers && (
        <>
          <section className="providerStatusBox">
            <div className="providerStatusRow">
              <span className={`sourceBadge ${state.tone === "ok" ? "ok" : state.tone === "warn" ? "warn" : "fallback"}`}>
                {state.badge}
              </span>
              {warnings.slice(0, 2).map((w) => (
                <span key={w} className="warnBadge">{warningLabel(w)}</span>
              ))}
            </div>
            <p className="statusHint">{state.detail}</p>
          </section>

          <section className="providerStatusBox">
            <div className="providerStatusRow">
              <span className={`sourceBadge ${confidenceInfo.tone}`}>{confidenceInfo.label}</span>
              {evidenceSignals.slice(0, 4).map((s) => (
                <span key={s.code} className="warnBadge">{signalLabel(s.code)}</span>
              ))}
            </div>
            {hasReliabilityRisk ? (
              <p className="statusHint">출생시간 미상 등으로 결과 신뢰도가 낮아질 수 있어요.</p>
            ) : (
              <p className="statusHint">핵심 관계 신호를 기반으로 계산된 결과예요.</p>
            )}
          </section>

          <section className="scoreBadgeWrap">
            <div className="scoreBadge">
              <strong>{score}</strong>
              <span>/ 100</span>
            </div>
            <p>전체 궁합 점수</p>
          </section>

          <ResultCard title="왜 이런 궁합이 나왔을까" rows={layers.explain} />
          <ResultCard
            title="핵심 근거 신호"
            rows={evidenceSignals.length
              ? evidenceSignals.map((s) => `${signalLabel(s.code)} · ${s.category}`)
              : ["근거 신호를 불러오는 중이거나 fallback 결과예요."]}
          />
          <ResultCard title="대화 궁합" tone="highlight" rows={[`대화 궁합 ${layers.talk}점`, "질문-확인-합의 순서로 대화하면 강점이 더 살아나요."]} />
          <ResultCard title="감정 궁합" rows={[`감정 궁합 ${layers.emotion}점`, "감정 표현 온도차를 맞추는 것이 핵심 포인트예요."]} />
          <ResultCard title="생활 궁합" rows={[`생활 궁합 ${layers.lifestyle}점`, "연락 리듬/생활 루틴 합의가 장기 안정감을 높여요."]} />
          <ResultCard title="갈등 포인트" rows={layers.conflict} />
          <ResultCard title="관계 팁" rows={layers.tips} />

          <ResultCard title="강점 포인트" tone="highlight" rows={summary.strengths.map((v) => `✅ ${v}`)} />
          <ResultCard title="주의 포인트" rows={summary.cautions.map((v) => `⚠️ ${v}`)} />

          <button type="button" className="ghostBtn" onClick={handleShare}>결과 공유</button>
          {message ? <p className="toastText">{message}</p> : null}
        </>
      )}
    </PageLayout>
  );
}
