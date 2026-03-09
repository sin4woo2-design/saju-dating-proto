import { useMemo, useState } from "react";
import ResultCard from "../../components/ResultCard/ResultCard";
import PageLayout from "../../components/layout/PageLayout";
import { genderLabels } from "../../constants/labels";
import { useTransientMessage } from "../../hooks/useTransientMessage";
import { calculateCompatibilityResult, generateCompatibilitySummary } from "../../lib/compatibility";
import { shareOrCopy } from "../../lib/share";
import type { Gender, UserProfileInput } from "../../types/saju";

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

export default function CompatibilityPage({ me }: Props) {
  const [birthDate, setBirthDate] = useState("");
  const [birthTime, setBirthTime] = useState("");
  const [gender, setGender] = useState<Gender>("other");
  const [score, setScore] = useState<number | null>(null);
  const [providerState, setProviderState] = useState<"provider" | "mock-fallback">("mock-fallback");
  const [warnings, setWarnings] = useState<string[]>([]);
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
    } catch {
      showMessage("궁합 계산에 실패했어요. 잠시 후 다시 시도해 주세요.");
    } finally {
      setIsCalculating(false);
    }
  };

  const summary = score !== null ? generateCompatibilitySummary(score) : null;
  const state = statusText(providerState, warnings);

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

      {summary && (
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

          <section className="scoreBadgeWrap">
            <div className="scoreBadge">
              <strong>{score}</strong>
              <span>/ 100</span>
            </div>
            <p>오늘의 궁합 체감 점수</p>
          </section>

          <ResultCard title="강점 포인트" tone="highlight" rows={summary.strengths.map((v) => `✅ ${v}`)} />
          <ResultCard title="주의 포인트" rows={summary.cautions.map((v) => `⚠️ ${v}`)} />

          <button type="button" className="ghostBtn" onClick={handleShare}>결과 공유</button>
          {message ? <p className="toastText">{message}</p> : null}
        </>
      )}
    </PageLayout>
  );
}
