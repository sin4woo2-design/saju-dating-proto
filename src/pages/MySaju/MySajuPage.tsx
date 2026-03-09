import { useEffect, useMemo, useState } from "react";
import ResultCard from "../../components/ResultCard/ResultCard";
import PageLayout from "../../components/layout/PageLayout";
import { elementLabels } from "../../constants/labels";
import { useTransientMessage } from "../../hooks/useTransientMessage";
import { calculateSajuResult } from "../../lib/sajuEngine";
import { shareOrCopy } from "../../lib/share";
import type { SajuProfile, UserProfileInput } from "../../types/saju";

interface Props {
  me: UserProfileInput;
}

function warningLabel(code: string) {
  if (code.includes("PARTIAL")) return "부분 데이터";
  if (code.includes("TIMEOUT")) return "타임아웃";
  if (code.includes("UNAVAILABLE")) return "연결 불가";
  return code;
}

export default function MySajuPage({ me }: Props) {
  const [profile, setProfile] = useState<SajuProfile | null>(null);
  const [providerState, setProviderState] = useState<"provider" | "mock-fallback">("mock-fallback");
  const [warnings, setWarnings] = useState<string[]>([]);
  const { message, showMessage } = useTransientMessage();

  useEffect(() => {
    let active = true;
    calculateSajuResult(me)
      .then((result) => {
        if (!active) return;
        setProfile(result.profile);
        setProviderState(result.providerState);
        setWarnings(result.warnings ?? []);
      })
      .catch(() => {
        if (active) showMessage("사주 계산에 실패했어요. 잠시 후 다시 시도해 주세요.");
      });

    return () => {
      active = false;
    };
  }, [me, showMessage]);

  const topSummary = useMemo(() => {
    if (!profile) return null;
    const sorted = Object.entries(profile.fiveElements).sort((a, b) => b[1] - a[1]);
    return {
      strong: `${elementLabels[sorted[0][0]]} 강세`,
      weak: `${elementLabels[sorted[sorted.length - 1][0]]} 보완 필요`,
    };
  }, [profile]);

  const handleShare = async () => {
    if (!profile) return;
    const result = await shareOrCopy({
      title: `${me.name}님의 사주 요약`,
      text: `${profile.personalitySummary}\n연애 스타일: ${profile.loveStyle}`,
    });
    showMessage(result === "shared" ? "공유 완료!" : "복사 완료! 원하는 곳에 붙여넣어 공유해보세요.");
  };

  if (!profile || !topSummary) {
    return (
      <PageLayout title={`${me.name}님의 사주 리포트`}>
        <p className="subtitle">사주 데이터를 불러오는 중...</p>
      </PageLayout>
    );
  }

  return (
    <PageLayout
      title={`${me.name}님의 사주 리포트`}
      action={<button type="button" className="ghostBtn" onClick={handleShare}>공유</button>}
    >
      <section className="providerStatusRow">
        <span className={`sourceBadge ${providerState === "provider" ? "ok" : "fallback"}`}>
          {providerState === "provider" ? "provider" : "mock fallback"}
        </span>
        {warnings.slice(0, 2).map((w) => (
          <span key={w} className="warnBadge">{warningLabel(w)}</span>
        ))}
      </section>

      <section className="summaryChips">
        <span>✨ {topSummary.strong}</span>
        <span>🛠️ {topSummary.weak}</span>
      </section>

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
      {message ? <p className="toastText">{message}</p> : null}
    </PageLayout>
  );
}
