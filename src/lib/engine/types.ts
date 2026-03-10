import type { SajuProfile, UserProfileInput, Gender } from "../../types/saju";
import type { CompatibilityRawSignal } from "./provider-contract";

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
    confidence?: "high" | "medium" | "low";
  };
}

export interface SajuChartSnapshot {
  pillars?: {
    year?: string;
    month?: string;
    day?: string;
    hour?: string;
  };
  signals?: string[];
  ruleVersion?: string;
  calculationSource?: string;
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
}
