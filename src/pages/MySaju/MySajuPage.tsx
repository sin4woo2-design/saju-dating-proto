import { useMemo } from "react";
import ResultCard from "../../components/ResultCard/ResultCard";
import PageLayout from "../../components/layout/PageLayout";
import { elementLabels } from "../../constants/labels";
import { useTransientMessage } from "../../hooks/useTransientMessage";
import { calculateSaju } from "../../lib/sajuEngine";
import { shareOrCopy } from "../../lib/share";
import type { UserProfileInput } from "../../types/saju";

interface Props {
  me: UserProfileInput;
}

export default function MySajuPage({ me }: Props) {
  const profile = calculateSaju(me);
  const { message, showMessage } = useTransientMessage();

  const topSummary = useMemo(() => {
    const sorted = Object.entries(profile.fiveElements).sort((a, b) => b[1] - a[1]);
    return {
      strong: `${elementLabels[sorted[0][0]]} 강세`,
      weak: `${elementLabels[sorted[sorted.length - 1][0]]} 보완 필요`,
    };
  }, [profile.fiveElements]);

  const handleShare = async () => {
    const result = await shareOrCopy({
      title: `${me.name}님의 사주 요약`,
      text: `${profile.personalitySummary}\n연애 스타일: ${profile.loveStyle}`,
    });
    showMessage(result === "shared" ? "공유 완료!" : "복사 완료! 원하는 곳에 붙여넣어 공유해보세요.");
  };

  return (
    <PageLayout
      title={`${me.name}님의 사주 리포트`}
      action={<button type="button" className="ghostBtn" onClick={handleShare}>공유</button>}
    >
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
