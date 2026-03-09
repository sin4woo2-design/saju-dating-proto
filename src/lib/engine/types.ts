import type { SajuProfile, UserProfileInput, Gender } from "../../types/saju";

export type EngineMode = "mock" | "real-provider";

export interface PairInput {
  birthDate: string;
  birthTime: string;
  gender: Gender;
}

export interface CompatibilityResult {
  score: number;
  source: EngineMode;
  providerState: "provider" | "mock-fallback";
  warnings?: string[];
}

export interface SajuResult {
  profile: SajuProfile;
  source: EngineMode;
  providerState: "provider" | "mock-fallback";
  warnings?: string[];
}

export interface SajuEngine {
  mode: EngineMode;
  calculateSaju(input: UserProfileInput): Promise<SajuResult>;
  calculateCompatibility(me: PairInput, partner: PairInput): Promise<CompatibilityResult>;
}
