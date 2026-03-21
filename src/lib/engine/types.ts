import type { SajuElementBreakdown, SajuPillarsSnapshot, SajuProfile, UserProfileInput, Gender } from "../../types/saju";
import type { CompatibilityConfidenceLevel, CompatibilityRawSignal, CompatibilitySubScoresV1, ProviderCompatibilityProvenance, CompatibilityBasisV1 } from "./provider-contract";
import type { HomeNarrativeSnapshot } from "./homeNarrative";
import type { PersonaNarrativeSnapshot } from "./personaNarrative";

export type EngineMode = "mock" | "real-provider";

export interface PairInput {
  birthDate: string;
  birthTime: string;
  gender: Gender;
}

export type ProviderState = "mock" | "provider" | "mock-fallback";

export interface CompatibilityResult {
  score: number;
  source: EngineMode;
  providerState: ProviderState;
  warnings?: string[];
  rawSignals?: CompatibilityRawSignal[];
  reliability?: {
    timeKnownMe?: boolean;
    timeKnownPartner?: boolean;
    confidence?: CompatibilityConfidenceLevel;
  };
  // v2 bridge shape (optional until provider full migration)
  totalScore?: number;
  subScores?: CompatibilitySubScoresV1;
  basis?: CompatibilityBasisV1;
  confidence?: {
    level?: CompatibilityConfidenceLevel;
    reasons?: string[];
  };
  provenance?: ProviderCompatibilityProvenance;
  scoreRuleVersion?: string;
}

export interface SajuChartSnapshot {
  pillars?: SajuPillarsSnapshot;
  signals?: string[];
  ruleVersion?: string;
  calculationSource?: string;
  requestId?: string;
  providerVersion?: string;
  engineVersion?: string;
  latencyMs?: number;
  breakdown?: SajuElementBreakdown;
}

export interface SajuResult {
  profile: SajuProfile;
  source: EngineMode;
  providerState: ProviderState;
  warnings?: string[];
  chart?: SajuChartSnapshot;
}

export interface SajuEngine {
  mode: EngineMode;
  calculateSaju(input: UserProfileInput): Promise<SajuResult>;
  calculateCompatibility(me: PairInput, partner: PairInput): Promise<CompatibilityResult>;
  calculateHomeNarrative?(input: UserProfileInput): Promise<HomeNarrativeSnapshot>;
  calculatePersonaNarrative?(input: UserProfileInput): Promise<PersonaNarrativeSnapshot>;
}
