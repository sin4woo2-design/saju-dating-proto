import type { Gender } from "../../types/saju";

export type ProviderWarningCode =
  | "PROVIDER_TIMEOUT"
  | "PROVIDER_UNAVAILABLE"
  | "PROVIDER_BAD_RESPONSE"
  | "PROVIDER_PARTIAL_DATA"
  | "COMPAT_RULE_DEGRADED"
  | "COMPAT_BASIS_INCOMPLETE";

export type CalendarType = "solar" | "lunar";

export interface ProviderPersonInput {
  name?: string;
  birthDate: string;
  /**
   * HH:mm. 출생시간 미상일 때도 문자열은 항상 전달하며(기본 12:00),
   * 실제 미상 여부는 birthTimeKnown=false 로 전달한다.
   */
  birthTime: string;
  birthTimeKnown?: boolean;
  gender: Gender;
  calendarType: CalendarType;
  timezone: "Asia/Seoul" | "UTC" | string;
}

export interface ProviderSajuRequest {
  person: ProviderPersonInput;
  options?: {
    includeSignals?: boolean;
    includeRawPillars?: boolean;
  };
}

export interface ProviderCompatibilityRequest {
  me: ProviderPersonInput;
  partner: ProviderPersonInput;
  options?: {
    includeSignals?: boolean;
    includeRawSignals?: boolean;
  };
}

export interface ProviderMeta {
  providerVersion: string;
  engineVersion?: string;
  requestId: string;
  latencyMs?: number;
}

export interface ProviderElementWeightMap {
  wood: number;
  fire: number;
  earth: number;
  metal: number;
  water: number;
}

export interface ProviderSajuTenGodInsight {
  pillar: "year" | "month" | "day" | "hour";
  stem?: string;
  code?:
    | "peer"
    | "rival"
    | "food"
    | "hurting"
    | "indirectWealth"
    | "directWealth"
    | "sevenKillings"
    | "directOfficer"
    | "indirectResource"
    | "directResource";
  label?: string;
  summary: string;
}

export interface ProviderSajuPillarDetail {
  raw?: string;
  stem?: string;
  branch?: string;
  stemLabel?: string;
  branchLabel?: string;
  stemElement?: "wood" | "fire" | "earth" | "metal" | "water";
  branchElement?: "wood" | "fire" | "earth" | "metal" | "water";
  season?: "spring" | "summer" | "transition" | "autumn" | "winter";
  hiddenStems?: string[];
  supportWeight?: number;
  stemTenGodCode?: ProviderSajuTenGodInsight["code"];
  stemTenGodLabel?: string;
}

export interface ProviderSajuBasisV2 {
  schemaVersion: "saju-basis-v2";
  basisOrigin?: "provider";
  dayMasterStem?: string;
  dayMasterLabel: string;
  dayMasterElement: "wood" | "fire" | "earth" | "metal" | "water";
  dayMasterYinYang?: "yin" | "yang";
  monthBranch?: string;
  monthBranchLabel?: string;
  season: "spring" | "summer" | "transition" | "autumn" | "winter";
  dominantElement: "wood" | "fire" | "earth" | "metal" | "water";
  weakestElement: "wood" | "fire" | "earth" | "metal" | "water";
  strengthLevel: "strong" | "balanced" | "weak";
  strengthScore: number;
  supportScore?: number;
  regulatingScore?: number;
  seasonalBonus?: number;
  rootSupportScore?: number;
  strengthReason: string;
  supportElements: Array<"wood" | "fire" | "earth" | "metal" | "water">;
  usefulElements: Array<"wood" | "fire" | "earth" | "metal" | "water">;
  cautionElements: Array<"wood" | "fire" | "earth" | "metal" | "water">;
  tenGods: ProviderSajuTenGodInsight[];
  summaryLines: string[];
  pillarDetails?: Partial<Record<"year" | "month" | "day" | "hour", ProviderSajuPillarDetail>>;
  notes?: string[];
}

export interface ProviderElementBreakdownV2 {
  ruleVersion: string;
  stemContribution: ProviderElementWeightMap;
  branchContribution: ProviderElementWeightMap;
  monthBranchBonusContribution: ProviderElementWeightMap;
  hiddenStemContribution: ProviderElementWeightMap;
  overlapMonthBonusHiddenEarth: boolean;
  earthDampeningEnabled: boolean;
  earthDampeningStrength: number;
  earthDampeningApplied: number;
  rawScore: ProviderElementWeightMap;
  finalNormalized: ProviderElementWeightMap;
  winner: "wood" | "fire" | "earth" | "metal" | "water";
}

export interface ProviderSajuResponse {
  meta: ProviderMeta;
  saju: {
    fiveElements?: Partial<Record<"wood" | "fire" | "earth" | "metal" | "water", number>>;
    pillars?: {
      year?: string;
      month?: string;
      day?: string;
      hour?: string;
    };
    signals?: string[];
    ruleVersion?: string;
    calculationSource?: string;
    basis?: ProviderSajuBasisV2;
    breakdown?: ProviderElementBreakdownV2;
  };
  warnings?: ProviderWarningCode[];
}

export type CompatibilitySignalCategory =
  | "relation-branch"
  | "relation-stem"
  | "element-dynamics"
  | "daymaster-dynamics"
  | "reliability";

export type CompatibilitySignalPolarity = "positive" | "negative" | "neutral";

export interface CompatibilityRawSignal {
  code: string;
  category: CompatibilitySignalCategory;
  polarity: CompatibilitySignalPolarity;
  weight?: number;
  note?: string;
}

export type CompatibilityConfidenceLevel = "high" | "medium" | "low";
export type CompatibilityBasisSchemaVersion = "compat-basis-v1";

export interface CompatibilitySubScoresV1 {
  branch: number;
  stem: number;
  elements: number;
  dayMaster: number;
  reliability: number;
}

export interface CompatibilityRelationBranchBasisItem {
  scope: "year" | "month" | "day" | "hour" | "cross";
  type: "hap" | "chung" | "hyeong" | "pa" | "hae" | "neutral";
  weight: number;
  code: string;
}

export interface CompatibilityRelationStemBasisItem {
  scope: "year" | "month" | "day" | "hour" | "cross";
  type: "hap" | "chung" | "clash" | "neutral";
  weight: number;
  code: string;
}

export interface CompatibilityElementDynamicsBasisItem {
  type: "generates" | "controls" | "overweight" | "lacking" | "balanced";
  weight: number;
  code: string;
}

export interface CompatibilityDayMasterDynamicsBasisItem {
  type: "support" | "clash" | "neutral";
  weight: number;
  code: string;
}

export interface CompatibilityReliabilityPenaltyItem {
  code: string;
  weight: number;
  reason: string;
}

export interface CompatibilityBasisParticipant {
  pillars?: {
    year?: string;
    month?: string;
    day?: string;
    hour?: string;
  };
  dayMaster?: string;
  dayMasterLabel?: string;
  strengthLevel?: "strong" | "balanced" | "weak";
  usefulElements?: Array<"wood" | "fire" | "earth" | "metal" | "water">;
  cautionElements?: Array<"wood" | "fire" | "earth" | "metal" | "water">;
  fiveElements?: Partial<Record<"wood" | "fire" | "earth" | "metal" | "water", number>>;
  birthTimeKnown?: boolean;
}

export interface CompatibilityBasisV1 {
  schemaVersion: CompatibilityBasisSchemaVersion;
  participants: {
    me: CompatibilityBasisParticipant;
    partner: CompatibilityBasisParticipant;
  };
  relations: {
    branchRelations: CompatibilityRelationBranchBasisItem[];
    stemRelations: CompatibilityRelationStemBasisItem[];
    elementDynamics: CompatibilityElementDynamicsBasisItem[];
    dayMasterDynamics: CompatibilityDayMasterDynamicsBasisItem[];
  };
  reliability: {
    penalties: CompatibilityReliabilityPenaltyItem[];
    confidence: CompatibilityConfidenceLevel;
  };
}

export interface ProviderCompatibilityProvenance {
  ruleVersion: string;
  calculationSource: string;
  basisSchemaVersion: CompatibilityBasisSchemaVersion;
  chartRuleVersion?: string;
}

export interface ProviderCompatibilityPayloadV2 {
  totalScore: number;
  subScores: CompatibilitySubScoresV1;
  basis: CompatibilityBasisV1;
  confidence: {
    level: CompatibilityConfidenceLevel;
    reasons: string[];
  };
  provenance: ProviderCompatibilityProvenance;
}

export interface ProviderCompatibilityResponse {
  meta: ProviderMeta;
  compatibility: {
    // v2 authoritative fields
    totalScore?: number;
    subScores?: CompatibilitySubScoresV1;
    basis?: CompatibilityBasisV1;
    confidence?: {
      level?: CompatibilityConfidenceLevel;
      reasons?: string[];
    };
    provenance?: ProviderCompatibilityProvenance;

    // v1 legacy fields (하위호환)
    score?: number;
    signals?: string[];
    rawSignals?: CompatibilityRawSignal[];
    reliability?: {
      timeKnownMe?: boolean;
      timeKnownPartner?: boolean;
      confidence?: CompatibilityConfidenceLevel;
    };
  };
  warnings?: ProviderWarningCode[];
}

export interface ProviderCompatibilityResponseV2 {
  meta: ProviderMeta;
  compatibility: ProviderCompatibilityPayloadV2 & {
    // 하위호환 필드 공존 허용
    score?: number;
    signals?: string[];
    rawSignals?: CompatibilityRawSignal[];
    reliability?: {
      timeKnownMe?: boolean;
      timeKnownPartner?: boolean;
      confidence?: CompatibilityConfidenceLevel;
    };
  };
  warnings?: ProviderWarningCode[];
}

export type ProviderErrorCode =
  | "INVALID_INPUT"
  | "UNSUPPORTED_TIMEZONE"
  | "UNSUPPORTED_CALENDAR_TYPE"
  | "UPSTREAM_TIMEOUT"
  | "INTERNAL_ERROR";

export interface ProviderErrorResponse {
  error: {
    code: ProviderErrorCode;
    message: string;
    requestId: string;
    retryable: boolean;
  };
}
