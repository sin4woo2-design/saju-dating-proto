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

function statusText(providerState: "provider" | "mock-fallback", warnings: string[]) {
  if (providerState === "mock-fallback") {
    return {
      badge: "fallback 사용",
      detail: "현재는 백업 규칙 결과를 보여주고 있어요.",
      tone: "fallback",
    } as const;
  }
  if (warnings.some((w) => w.includes("PARTIAL"))) {
    return {
      badge: "일부 보정됨",
      detail: "출생시간 미상/부분 데이터가 있어 결과 해석에 주의가 필요해요.",
      tone: "warn",
    } as const;
  }
  return {
    badge: "실계산 사용",
    detail: "lunar-python 계산 결과가 정상 반영되었어요.",
    tone: "ok",
  } as const;
}

function buildCautionPatterns(fiveElements: SajuProfile["fiveElements"]) {
  const sorted = Object.entries(fiveElements).sort((a, b) => b[1] - a[1]);
  const weak = sorted[sorted.length - 1][0];

  if (weak === "fire") return ["감정 표현이 늦어 오해가 생길 수 있어요.", "관심 표현을 문장으로 자주 확인해보세요."];
  if (weak === "water") return ["감정이 격해질 때 회복 시간이 오래 걸릴 수 있어요.", "갈등 시 대화 재개 시간을 미리 약속하면 좋아요."];
  if (weak === "earth") return ["관계 리듬이 불규칙해지면 피로가 쌓일 수 있어요.", "연락/만남 주기를 최소 기준으로 정해두세요."];
  if (weak === "metal") return ["기준이 흔들리면 작은 실망이 누적될 수 있어요.", "경계선과 우선순위를 초반에 명확히 합의하세요."];
  return ["성장 속도 차이로 템포가 어긋날 수 있어요.", "서로의 목표를 월 단위로 체크하면 안정적이에요."];
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

  const state = statusText(providerState, warnings);

  const cautionPatterns = useMemo(
    () => (profile ? buildCautionPatterns(profile.fiveElements) : []),
    [profile]
  );

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

      <ResultCard
        title="핵심 요약"
        tone="highlight"
        rows={[`강세: ${topSummary.strong}`, `보완: ${topSummary.weak}`, "전체적으로 관계 몰입도는 높고, 감정 리듬 조율이 핵심이에요."]}
      />

      <section className="elementCard">
        {Object.entries(profile.fiveElements).map(([key, value]) => (
          <div key={key} className="barRow">
            <strong>{elementLabels[key] ?? key}</strong>
            <div className="barTrack"><i style={{ width: `${value}%` }} /></div>
            <span>{value}</span>
          </div>
        ))}
      </section>

      <ResultCard title="성격 · 기질" rows={[profile.personalitySummary]} />
      <ResultCard title="연애 스타일" rows={[profile.loveStyle]} />
      <ResultCard title="잘 맞는 상대" rows={profile.idealTraits} />
      <ResultCard title="주의할 관계 패턴" rows={cautionPatterns} />
      {message ? <p className="toastText">{message}</p> : null}
    </PageLayout>
  );
}
