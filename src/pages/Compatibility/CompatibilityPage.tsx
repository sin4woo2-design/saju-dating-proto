import { useMemo, useState } from "react";
import PageLayout from "../../components/layout/PageLayout";
import { genderLabels } from "../../constants/labels";
import { useTransientMessage } from "../../hooks/useTransientMessage";
import { calculateCompatibilityResult } from "../../lib/compatibility";
import { buildCompatibilityViewModel } from "../../lib/compatibilityInsights";
import { shareOrCopy } from "../../lib/share";
import type { Gender, UserProfileInput } from "../../types/saju";
import type { CompatibilityBasisV1, CompatibilityRawSignal, CompatibilitySubScoresV1, ProviderCompatibilityProvenance } from "../../lib/engine/provider-contract";
import { getCompatSignalMeta } from "../../lib/engine/compatSignalCatalog";
import "./CompatibilityPage.css";

interface Props {
  me: UserProfileInput;
}

function warningLabel(code: string) {
  if (code.includes("PARTIAL")) return "부분 데이터";
  if (code.includes("TIMEOUT")) return "지연 발생";
  if (code.includes("UNAVAILABLE")) return "연결 불가";
  return code;
}

function statusTone(providerState: string, warnings: string[]) {
  if (providerState === "mock" || providerState === "mock-fallback") return "fallback";
  if (warnings.some((w) => w.includes("PARTIAL"))) return "warn";
  return "ok";
}

function statusBadgeText(providerState: string, warnings: string[]) {
  if (providerState === "mock") return "mock 모드";
  if (providerState === "mock-fallback") return "fallback 사용";
  if (warnings.some((w) => w.includes("PARTIAL"))) return "일부 보정됨";
  return "실계산 사용";
}

function confidenceBadge(conf?: "high" | "medium" | "low") {
  if (conf === "high") return { label: "신뢰도 높음", guide: "서로의 시간 정보가 충분해 해석 안정감이 높아요.", tone: "ok" as const };
  if (conf === "medium") return { label: "신뢰도 보통", guide: "핵심 흐름은 유효하지만 일부 값은 보정되었어요.", tone: "warn" as const };
  return { label: "신뢰도 참고", guide: "출생시간 미상 등으로 큰 흐름 중심으로 봐주세요.", tone: "fallback" as const };
}

function signalLabel(code: string) {
  return getCompatSignalMeta(code)?.label ?? code;
}

function scoreGrade(score: number) {
  if (score >= 85) return "A";
  if (score >= 70) return "B";
  if (score >= 55) return "C";
  return "D";
}

function signalDescription(code: string) {
  return getCompatSignalMeta(code)?.desc ?? "해당 신호는 관계 상호작용 패턴을 보여주는 보조 지표예요.";
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
  const [subScores, setSubScores] = useState<CompatibilitySubScoresV1 | null>(null);
  const [basis, setBasis] = useState<CompatibilityBasisV1 | null>(null);
  const [provenance, setProvenance] = useState<ProviderCompatibilityProvenance | null>(null);
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
      const resolvedScore = result.totalScore ?? result.score;
      setScore(resolvedScore);
      setProviderState(result.providerState);
      setWarnings(result.warnings ?? []);
      setRawSignals(result.rawSignals ?? []);
      setSubScores(result.subScores ?? null);
      setBasis(result.basis ?? null);
      setProvenance(result.provenance ?? null);
      setConfidence(result.confidence?.level ?? result.reliability?.confidence ?? "low");
      setSelectedSignal(null);
    } catch {
      showMessage("궁합 계산에 실패했어요. 잠시 후 다시 시도해 주세요.");
    } finally {
      setIsCalculating(false);
    }
  };

  const viewModel = score !== null
    ? buildCompatibilityViewModel({
        score,
        rawSignals,
        subScores: subScores ?? undefined,
        basis: basis ?? undefined,
        confidence,
        warnings,
        provenance,
      })
    : null;
  const confidenceInfo = confidenceBadge(confidence);

  const evidenceSignals = rawSignals.filter((s) => s.category !== "reliability").slice(0, 6);
  const reliabilitySignals = rawSignals.filter((s) => s.category === "reliability").slice(0, 3);
  const selectedSignalDescription = selectedSignal ? signalDescription(selectedSignal) : null;
  const grade = score !== null ? scoreGrade(score) : null;

  const resetPartnerForm = () => {
    setBirthDate("");
    setBirthTime("");
    setGender("other");
  };

  const handleShare = async () => {
    if (score === null || !viewModel) return;
    const result = await shareOrCopy({
      title: "우리 궁합 점수",
      text: `사주 궁합 ${score}점\n요약: ${viewModel.overview}\n강점: ${viewModel.strengths.join(", ")}`,
    });
    showMessage(result === "shared" ? "공유 완료!" : "복사 완료!");
  };

  const tone = statusTone(providerState, warnings);
  const badgeText = statusBadgeText(providerState, warnings);

  return (
    <PageLayout title="궁합 보기" subtitle="코어 시그널을 통해 두 사람의 연결성을 확인해요.">
      
      {/* ── INIT STATE OR INPUT CARD ── */}
      <section className="compatInputCard anim-fade-in">
        <div className="compatInputHead">
          <h3>상대 정보 입력</h3>
          <p>입력은 1분이면 끝나요. 날짜·시간을 알수록 결과 신뢰도가 높아져요.</p>
        </div>

        <div className="inputRowGroup">
          <label className="fieldLabel">상대 생년월일</label>
          <input type="date" value={birthDate} onChange={(e) => setBirthDate(e.target.value)} className="compatInput" />
        </div>

        <div className="inputRowGroup">
          <label className="fieldLabel">상대 출생시간</label>
          <input type="time" value={birthTime} onChange={(e) => setBirthTime(e.target.value)} className="compatInput" />
        </div>

        <div className="inputRowGroup">
          <label className="fieldLabel">상대 성별</label>
          <select value={gender} onChange={(e) => setGender(e.target.value as Gender)} className="compatSelect">
            <option value="male">{genderLabels.male}</option>
            <option value="female">{genderLabels.female}</option>
            <option value="other">{genderLabels.other}</option>
          </select>
        </div>

        <div className="compatInputActions">
          <button type="button" className="compatSubmitBtn" disabled={!isValid || isCalculating} onClick={onCalculate}>
            {isCalculating ? "궁합 리포트 생성 중..." : (score !== null ? "새로 계산하기" : "궁합 계산하기")}
          </button>
          <button type="button" className="compatResetBtn" onClick={resetPartnerForm}>
            입력 초기화
          </button>
        </div>
      </section>

      {/* ── RESULT VIEW ── */}
      {viewModel && (
        <div className="compatResultView anim-slide-up">
          
          {/* ── MAIN SCORE HERO ── */}
          <section className="compatHero">
            <div className="compatHeroHeader">
               <span className={`statusBadge ${tone}`}>{badgeText}</span>
               <span className={`statusBadge ${confidenceInfo.tone}`}>{confidenceInfo.label}</span>
               {warnings.slice(0, 2).map((w) => (
                 <span key={w} className="statusBadge warn">{warningLabel(w)}</span>
               ))}
            </div>
            
            <div className="compatScoreCircle">
              <strong className="compatScore">{score}</strong>
              <span className="compatScoreMax">/ 100</span>
            </div>

            <div className="compatHeroFooter">
              <h3>전체 궁합 점수</h3>
              <p className="compatGradeLine">등급 {grade} · {viewModel.gradeLine}</p>
              <p>{viewModel.overview}</p>
              {provenance ? (
                <p className="compatQaLine">
                  source: {provenance.calculationSource} · rule: {provenance.ruleVersion}
                </p>
              ) : null}
              {basis?.participants.me.dayMasterLabel && basis?.participants.partner.dayMasterLabel ? (
                <p className="compatQaLine">
                  내 일간 {basis.participants.me.dayMasterLabel} · 상대 일간 {basis.participants.partner.dayMasterLabel}
                </p>
              ) : null}
            </div>
          </section>

          {/* ── SIGNALS PANEL ── */}
          <section className="compatSignalCard">
            <h3 className="sectionTitle">핵심 근거 신호</h3>
            <div className="signalChipsGrid">
              {evidenceSignals.length ? evidenceSignals.map((s) => (
                <button
                  key={`${s.code}-${s.category}`}
                  type="button"
                  className={`compatSignalChip ${selectedSignal === s.code ? "active" : ""}`}
                  onClick={() => setSelectedSignal((prev) => prev === s.code ? null : s.code)}
                >
                  {signalLabel(s.code)}
                </button>
              )) : <span className="emptySignalText">근거 신호를 불러오지 못했거나 fallback 결과예요.</span>}
            </div>
            
            {selectedSignalDescription && (
              <div className="signalDescArea anim-scale-in">
                <p>{selectedSignalDescription}</p>
              </div>
            )}
            
            {reliabilitySignals.length ? (
              <p className="signalReferenceHint">참고: {reliabilitySignals.map((s) => signalLabel(s.code)).join(" · ")}</p>
            ) : null}
          </section>

          {/* ── CATEGORY SCORES ── */}
          <section className="compatCategoryRows">
            {subScores ? (
              <p className="compatSubscoreHint">
                basis Δ · branch {subScores.branch} / stem {subScores.stem} / elements {subScores.elements} / dayMaster {subScores.dayMaster} / reliability {subScores.reliability}
              </p>
            ) : null}
            <article className="compatCategoryRow">
              <div className="catHead">
                <strong>대화 궁합</strong>
                <span className="catScore">{viewModel.talk}점</span>
              </div>
              <p>{viewModel.basisHighlights[0]?.body ?? "중요한 대화는 확인 질문을 먼저 두면 장점이 더 잘 드러나요."}</p>
            </article>
            <article className="compatCategoryRow">
              <div className="catHead">
                <strong>감정 궁합</strong>
                <span className="catScore">{viewModel.emotion}점</span>
              </div>
              <p>{viewModel.basisHighlights[1]?.body ?? "감정 반응 속도와 해석 차이를 천천히 맞추면 관계가 한결 부드러워져요."}</p>
            </article>
            <article className="compatCategoryRow">
              <div className="catHead">
                <strong>생활 궁합</strong>
                <span className="catScore">{viewModel.lifestyle}점</span>
              </div>
              <p>{viewModel.basisHighlights[2]?.body ?? "연락 간격과 만남 빈도처럼 기본 약속을 먼저 맞춰 두면 훨씬 덜 부딪혀요."}</p>
            </article>
          </section>

          <section className="compatBasisGrid">
            {viewModel.basisHighlights.map((item, index) => (
              <article key={`${item.title}-${index}`} className={`compatBasisCard ${item.tone}`}>
                <strong>{item.title}</strong>
                <p>{item.body}</p>
              </article>
            ))}
          </section>

          <section className="compatActionCard">
            <h3 className="sectionTitle">관계 운영 가이드</h3>
            <ul className="compatActionList">
              {viewModel.tips.map((tip, idx) => (
                <li key={`action-${idx}`}>{tip}</li>
              ))}
            </ul>
          </section>

          {/* ── ACCORDION DETAILS ── */}
          <div className="compatDetailsGroup">
            <details className="foldSection" open>
              <summary>갈등 포인트</summary>
              <div className="foldContent">
                <ul className="detailList">
                  {viewModel.cautions.map((text, idx) => (
                    <li key={idx}>{text}</li>
                  ))}
                </ul>
              </div>
            </details>

            <details className="foldSection" open>
              <summary>강점 포인트</summary>
              <div className="foldContent">
                <ul className="detailList">
                  {viewModel.strengths.map((text, idx) => (
                    <li key={idx}>{text}</li>
                  ))}
                </ul>
              </div>
            </details>

            <details className="foldSection">
              <summary>신뢰도 메모</summary>
              <div className="foldContent">
                <ul className="detailList">
                  <li>{confidenceInfo.guide}</li>
                  {viewModel.reliabilityNotes.map((text, idx) => (
                    <li key={`rel-${idx}`}>{text}</li>
                  ))}
                </ul>
              </div>
            </details>
          </div>

          <button type="button" className="compatShareBtn" onClick={handleShare}>
            결과 공유하기
          </button>
          
        </div>
      )}
      
      {message && <p className="toastMsg anim-slide-up">{message}</p>}
    </PageLayout>
  );
}
