import type {
  CompatibilityBasisV1,
  CompatibilityConfidenceLevel,
  CompatibilityRawSignal,
  CompatibilitySubScoresV1,
  ProviderCompatibilityProvenance,
} from "./engine/provider-contract";
import { getCompatSignalMeta } from "./engine/compatSignalCatalog";

export interface CompatibilityHighlight {
  title: string;
  body: string;
  tone: "positive" | "neutral" | "warning";
}

export interface CompatibilityViewModel {
  talk: number;
  emotion: number;
  lifestyle: number;
  overview: string;
  gradeLine: string;
  strengths: string[];
  cautions: string[];
  tips: string[];
  basisHighlights: CompatibilityHighlight[];
  reliabilityNotes: string[];
}

interface CompatibilityViewInput {
  score: number;
  rawSignals?: CompatibilityRawSignal[];
  subScores?: CompatibilitySubScoresV1;
  basis?: CompatibilityBasisV1;
  confidence?: CompatibilityConfidenceLevel;
  warnings?: string[];
  provenance?: ProviderCompatibilityProvenance | null;
}

function clamp(value: number, min = 40, max = 98) {
  return Math.max(min, Math.min(max, value));
}

function sumSignalWeights(rawSignals: CompatibilityRawSignal[], category: CompatibilityRawSignal["category"]) {
  return rawSignals
    .filter((signal) => signal.category === category)
    .reduce((acc, signal) => acc + (signal.weight ?? 0), 0);
}

function inferCategoryScores(score: number, rawSignals: CompatibilityRawSignal[], subScores?: CompatibilitySubScoresV1) {
  const branchDelta = subScores?.branch ?? sumSignalWeights(rawSignals, "relation-branch");
  const stemDelta = subScores?.stem ?? sumSignalWeights(rawSignals, "relation-stem");
  const elementDelta = subScores?.elements ?? sumSignalWeights(rawSignals, "element-dynamics");
  const dayMasterDelta = subScores?.dayMaster ?? sumSignalWeights(rawSignals, "daymaster-dynamics");
  const reliabilityDelta = subScores?.reliability ?? sumSignalWeights(rawSignals, "reliability");

  return {
    talk: clamp(score + Math.round(stemDelta * 0.7) + Math.round(branchDelta * 0.25)),
    emotion: clamp(score + Math.round(dayMasterDelta * 0.8) + Math.round(reliabilityDelta * 0.2)),
    lifestyle: clamp(score + Math.round(elementDelta * 0.65) + Math.round(branchDelta * 0.35)),
    branchDelta,
    stemDelta,
    elementDelta,
    dayMasterDelta,
    reliabilityDelta,
  };
}

function confidenceLabel(confidence: CompatibilityConfidenceLevel) {
  if (confidence === "high") return "신뢰도 높음";
  if (confidence === "medium") return "신뢰도 보통";
  return "신뢰도 참고";
}

function confidenceGuide(confidence: CompatibilityConfidenceLevel) {
  if (confidence === "high") return "출생시간과 basis 정보가 비교적 충실해 세부 흐름까지 참고하기 좋아요.";
  if (confidence === "medium") return "큰 방향은 유효하지만 세부 해석은 상황에 따라 달라질 수 있어요.";
  return "출생시간 또는 basis 정보가 부족해 큰 흐름 위주로 읽는 편이 안전해요.";
}

function topSignals(rawSignals: CompatibilityRawSignal[], polarity: "positive" | "negative", limit = 3) {
  return rawSignals
    .filter((signal) => signal.category !== "reliability" && signal.polarity === polarity)
    .sort((a, b) => Math.abs((b.weight ?? 0)) - Math.abs((a.weight ?? 0)))
    .slice(0, limit);
}

function signalSummary(signal: CompatibilityRawSignal) {
  const meta = getCompatSignalMeta(signal.code);
  if (meta) return `${meta.label} · ${meta.desc}`;
  return `${signal.code} · 관계 리듬을 읽는 데 참고할 만한 신호예요.`;
}

function inferRelationTone(type: string) {
  if (type === "hap" || type === "generates" || type === "support" || type === "balanced") return "positive" as const;
  if (type === "neutral") return "neutral" as const;
  return "warning" as const;
}

function buildBasisHighlights(basis?: CompatibilityBasisV1): CompatibilityHighlight[] {
  if (!basis) {
    return [
      {
        title: "근거 축 준비 중",
        body: "현재는 raw signal 위주로 궁합을 읽고 있어요. provider basis가 들어오면 더 정밀하게 설명할 수 있어요.",
        tone: "neutral",
      },
    ];
  }

  const branchTop = [...basis.relations.branchRelations].sort((a, b) => Math.abs(b.weight) - Math.abs(a.weight))[0];
  const stemTop = [...basis.relations.stemRelations].sort((a, b) => Math.abs(b.weight) - Math.abs(a.weight))[0];
  const dayMasterTop = [...basis.relations.dayMasterDynamics].sort((a, b) => Math.abs(b.weight) - Math.abs(a.weight))[0];
  const elementTop = [...basis.relations.elementDynamics].sort((a, b) => Math.abs(b.weight) - Math.abs(a.weight))[0];

  const items: CompatibilityHighlight[] = [];

  if (stemTop) {
    const meta = getCompatSignalMeta(stemTop.code);
    items.push({
      title: "대화 축",
      body: meta?.desc ?? `천간 관계 ${stemTop.type} 신호가 크게 작동하고 있어 대화 리듬에 직접 영향이 있어요.`,
      tone: inferRelationTone(stemTop.type),
    });
  }

  if (dayMasterTop) {
    const meta = getCompatSignalMeta(dayMasterTop.code);
    items.push({
      title: "감정 축",
      body: meta?.desc ?? `일간 역학 ${dayMasterTop.type} 신호가 커서 감정 반응 방식과 안정감에 영향을 줘요.`,
      tone: inferRelationTone(dayMasterTop.type),
    });
  }

  if (elementTop || branchTop) {
    const elementMeta = elementTop ? getCompatSignalMeta(elementTop.code) : null;
    const branchMeta = branchTop ? getCompatSignalMeta(branchTop.code) : null;
    items.push({
      title: "생활 축",
      body: elementMeta?.desc ?? branchMeta?.desc ?? "일상 템포와 습관 차이가 실제 궁합 체감에 직접 영향을 주는 상태예요.",
      tone: inferRelationTone(elementTop?.type ?? branchTop?.type ?? "neutral"),
    });
  }

  const me = basis.participants.me;
  const partner = basis.participants.partner;
  if (me.dayMasterLabel && partner.dayMasterLabel) {
    const meUseful = me.usefulElements?.join("·");
    const partnerUseful = partner.usefulElements?.join("·");
    items.push({
      title: "명식 맞물림",
      body: `${me.dayMasterLabel}와 ${partner.dayMasterLabel} 조합으로 보고 있어요.${meUseful ? ` 나는 ${meUseful} 쪽 기운이 들어올 때 숨이 트이고` : ""}${partnerUseful ? `, 상대는 ${partnerUseful} 쪽에서 호흡이 잘 맞는 편이에요.` : ""}`,
      tone: "neutral",
    });
  }

  return items;
}

function buildStrengths(rawSignals: CompatibilityRawSignal[], score: number) {
  const positives = topSignals(rawSignals, "positive");
  if (positives.length) return positives.map(signalSummary);

  if (score >= 85) {
    return [
      "초반 친밀감과 대화 템포가 잘 맞아 빠르게 가까워지기 쉬운 조합이에요.",
      "감정 교류와 일상 템포가 함께 맞아 오래 이어 갈 기반도 괜찮아요.",
    ];
  }

  return [
    "서로 다른 장점을 메워 줄 여지가 있고, 조율만 잘되면 함께 있을 때 만족감이 꽤 올라갈 수 있는 조합이에요.",
  ];
}

function buildCautions(rawSignals: CompatibilityRawSignal[], confidence: CompatibilityConfidenceLevel, score: number) {
  const negatives = topSignals(rawSignals, "negative");
  const cautions = negatives.map(signalSummary);

  if (confidence === "low") {
    cautions.push("출생시간 또는 일부 basis 정보가 부족해서 세부 해석은 보수적으로 보는 편이 좋아요.");
  }

  if (!cautions.length && score < 70) {
    cautions.push("초반에는 감정 표현 속도와 연락 리듬을 먼저 맞춰 두는 편이 좋아요.");
  }

  return cautions.length ? cautions.slice(0, 3) : ["큰 충돌 신호는 적지만 연락 간격과 감정 표현 방식은 미리 맞춰 두는 편이 좋아요."];
}

function buildTips(talk: number, emotion: number, lifestyle: number, confidence: CompatibilityConfidenceLevel) {
  const tips: string[] = [];

  tips.push(
    talk < 72
      ? "중요한 말은 결론부터 밀기보다 확인 질문 한 번을 먼저 두는 편이 안전해요."
      : "대화 호흡이 괜찮은 조합이라, 잘 맞았던 말투와 템포를 반복해서 둘만의 습관으로 만드는 게 좋아요.",
  );

  tips.push(
    emotion < 72
      ? "감정 반응은 즉답보다 한 템포 늦춰 말하고, 해석 차이를 바로 확인해 주세요."
      : "감정 교류가 비교적 부드러운 조합이라, 고마움이나 호감을 자주 말해 줄수록 더 단단해져요.",
  );

  tips.push(
    lifestyle < 72
      ? "만남 빈도, 연락 주기, 돈 쓰는 방식처럼 일상 규칙을 먼저 정해 두는 편이 좋아요."
      : "일상 루틴이 크게 어긋나지 않는 편이라 공통 습관 하나만 만들어도 관계가 더 빨리 안정돼요.",
  );

  if (confidence === "low") {
    tips.push("지금 결과는 큰 흐름 위주라 중요한 결정은 몇 번 더 만나며 체감 확인을 거치는 편이 안전해요.");
  }

  return tips.slice(0, 4);
}

function buildOverview(score: number, confidence: CompatibilityConfidenceLevel, warnings?: string[]) {
  const warningLine = warnings?.some((warning) => warning.includes("PARTIAL") || warning.includes("DEGRADED"))
    ? "일부 데이터가 보정된 결과예요."
    : "";

  if (score >= 85) {
    return `서로의 템포가 잘 맞아 초반 친밀감과 장기 안정감이 함께 기대되는 조합이에요. ${confidenceGuide(confidence)} ${warningLine}`.trim();
  }
  if (score >= 72) {
    return `강점이 분명하고 조율 여지도 충분한 조합이에요. 대화 방식과 일상 템포만 조금 맞추면 함께 있을 때 만족감이 더 올라갈 수 있어요. ${confidenceGuide(confidence)} ${warningLine}`.trim();
  }
  if (score >= 60) {
    return `매력 포인트는 있지만 해석 차이와 일상 템포 조율이 중요한 조합이에요. 서두르기보다 기본 규칙을 먼저 맞추는 편이 좋아요. ${confidenceGuide(confidence)} ${warningLine}`.trim();
  }
  return `끌림은 있을 수 있지만 서로의 해석 방식과 일상 템포 차이가 크게 작동하는 조합이에요. 관계 규칙을 천천히 맞춰 가는 접근이 필요해요. ${confidenceGuide(confidence)} ${warningLine}`.trim();
}

function buildReliabilityNotes(
  confidence: CompatibilityConfidenceLevel,
  rawSignals: CompatibilityRawSignal[],
  basis?: CompatibilityBasisV1,
  provenance?: ProviderCompatibilityProvenance | null,
) {
  const notes: string[] = [confidenceGuide(confidence)];

  const reliabilitySignals = rawSignals.filter((signal) => signal.category === "reliability");
  reliabilitySignals.forEach((signal) => {
    const meta = getCompatSignalMeta(signal.code);
    notes.push(meta?.desc ?? `${signal.code} 신호가 있어 일부 보정이 적용됐어요.`);
  });

  basis?.reliability.penalties.forEach((penalty) => {
    notes.push(`${penalty.reason} (penalty ${penalty.weight})`);
  });

  if (provenance) {
    notes.push(`계산 기준은 ${provenance.ruleVersion}, chart source는 ${provenance.calculationSource}예요.`);
  }

  return Array.from(new Set(notes)).slice(0, 4);
}

export function buildCompatibilityViewModel(input: CompatibilityViewInput): CompatibilityViewModel {
  const rawSignals = input.rawSignals ?? [];
  const confidence = input.confidence ?? input.basis?.reliability.confidence ?? "low";
  const categoryScores = inferCategoryScores(input.score, rawSignals, input.subScores);

  return {
    talk: categoryScores.talk,
    emotion: categoryScores.emotion,
    lifestyle: categoryScores.lifestyle,
    overview: buildOverview(input.score, confidence, input.warnings),
    gradeLine: `${confidenceLabel(confidence)} · 대화 ${categoryScores.talk} / 감정 ${categoryScores.emotion} / 생활 ${categoryScores.lifestyle}`,
    strengths: buildStrengths(rawSignals, input.score),
    cautions: buildCautions(rawSignals, confidence, input.score),
    tips: buildTips(categoryScores.talk, categoryScores.emotion, categoryScores.lifestyle, confidence),
    basisHighlights: buildBasisHighlights(input.basis),
    reliabilityNotes: buildReliabilityNotes(confidence, rawSignals, input.basis, input.provenance),
  };
}
