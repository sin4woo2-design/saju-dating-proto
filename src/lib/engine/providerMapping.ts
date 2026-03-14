import type { SajuProfile } from "../../types/saju";
import type {
  ProviderCompatibilityResponse,
  ProviderSajuResponse,
  ProviderWarningCode,
} from "./provider-contract";
import { isKnownCompatSignal } from "./compatSignalCatalog";

const ELEMENT_KEYS = ["wood", "fire", "earth", "metal", "water"] as const;
const DEFAULT_ELEMENT = 50;
const DEFAULT_COMPAT_SCORE = 72;
const COMPAT_RULE_VERSION = "compat-v1-rawsignals";

function clamp100(value: number) {
  return Math.max(0, Math.min(100, value));
}

export function mapProviderWarnings(raw?: ProviderWarningCode[]): string[] | undefined {
  if (!raw?.length) return undefined;
  return raw;
}

export function mapProviderSajuResponseToProfile(raw: ProviderSajuResponse): {
  fiveElements: SajuProfile["fiveElements"];
  warnings?: string[];
  chart: {
    pillars?: ProviderSajuResponse["saju"]["pillars"];
    signals?: string[];
    ruleVersion?: string;
    calculationSource?: string;
  };
} {
  const warnings = new Set<string>(mapProviderWarnings(raw.warnings) ?? []);
  const source = raw.saju.fiveElements ?? {};

  const fiveElements = {
    wood: DEFAULT_ELEMENT,
    fire: DEFAULT_ELEMENT,
    earth: DEFAULT_ELEMENT,
    metal: DEFAULT_ELEMENT,
    water: DEFAULT_ELEMENT,
  };

  for (const key of ELEMENT_KEYS) {
    const value = source[key];
    if (typeof value === "number") {
      fiveElements[key] = clamp100(value);
    } else {
      warnings.add("PROVIDER_PARTIAL_DATA");
    }
  }

  return {
    fiveElements,
    warnings: warnings.size ? Array.from(warnings) : undefined,
    chart: {
      pillars: raw.saju.pillars,
      signals: raw.saju.signals,
      ruleVersion: raw.saju.ruleVersion,
      calculationSource: raw.saju.calculationSource,
    },
  };
}

export function mapProviderCompatibilityToScore(raw: ProviderCompatibilityResponse): {
  score: number;
  totalScore?: number;
  subScores?: ProviderCompatibilityResponse["compatibility"]["subScores"];
  basis?: ProviderCompatibilityResponse["compatibility"]["basis"];
  confidence?: ProviderCompatibilityResponse["compatibility"]["confidence"];
  provenance?: ProviderCompatibilityResponse["compatibility"]["provenance"];
  warnings?: string[];
  rawSignals?: ProviderCompatibilityResponse["compatibility"]["rawSignals"];
  reliability?: ProviderCompatibilityResponse["compatibility"]["reliability"];
  scoreRuleVersion: string;
} {
  const warnings = new Set<string>(mapProviderWarnings(raw.warnings) ?? []);
  const providerScore = raw.compatibility.totalScore ?? raw.compatibility.score;
  const rawSignals = raw.compatibility.rawSignals ?? [];
  const scoreRuleVersionFromProvenance = raw.compatibility.provenance?.ruleVersion;

  if (rawSignals.length > 0) {
    const unknownSignalFound = rawSignals.some((s) => !isKnownCompatSignal(s.code));
    if (unknownSignalFound) {
      warnings.add("COMPAT_UNKNOWN_SIGNAL");
    }

    const derived = Math.max(40, Math.min(96, 70 + rawSignals.reduce((acc, s) => acc + (s.weight ?? 0), 0)));

    if (typeof providerScore === "number" && Math.abs(providerScore - derived) >= 6) {
      warnings.add("COMPAT_SCORE_MISMATCH");
    }

    return {
      score: clamp100(derived),
      totalScore: raw.compatibility.totalScore,
      subScores: raw.compatibility.subScores,
      basis: raw.compatibility.basis,
      confidence: raw.compatibility.confidence,
      provenance: raw.compatibility.provenance,
      warnings: warnings.size ? Array.from(warnings) : undefined,
      rawSignals: raw.compatibility.rawSignals,
      reliability: raw.compatibility.reliability,
      scoreRuleVersion: scoreRuleVersionFromProvenance ?? COMPAT_RULE_VERSION,
    };
  }

  if (typeof providerScore === "number") {
    warnings.add("PROVIDER_PARTIAL_DATA");
    return {
      score: clamp100(providerScore),
      totalScore: raw.compatibility.totalScore,
      subScores: raw.compatibility.subScores,
      basis: raw.compatibility.basis,
      confidence: raw.compatibility.confidence,
      provenance: raw.compatibility.provenance,
      warnings: warnings.size ? Array.from(warnings) : undefined,
      rawSignals: raw.compatibility.rawSignals,
      reliability: raw.compatibility.reliability,
      scoreRuleVersion: scoreRuleVersionFromProvenance ?? "compat-provider-score-fallback",
    };
  }

  warnings.add("PROVIDER_PARTIAL_DATA");
  return {
    score: DEFAULT_COMPAT_SCORE,
    totalScore: raw.compatibility.totalScore,
    subScores: raw.compatibility.subScores,
    basis: raw.compatibility.basis,
    confidence: raw.compatibility.confidence,
    provenance: raw.compatibility.provenance,
    warnings: Array.from(warnings),
    rawSignals: raw.compatibility.rawSignals,
    reliability: raw.compatibility.reliability,
    scoreRuleVersion: scoreRuleVersionFromProvenance ?? "compat-default-fallback",
  };
}
