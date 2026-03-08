import type { SajuProfile, UserProfileInput, Gender } from "../../types/saju";

export type EngineMode = "mock" | "real-stub";

export interface PairInput {
  birthDate: string;
  birthTime: string;
  gender: Gender;
}

export interface CompatibilityResult {
  score: number;
  source: EngineMode;
  warnings?: string[];
}

export interface SajuResult {
  profile: SajuProfile;
  source: EngineMode;
  warnings?: string[];
}

export interface SajuEngine {
  mode: EngineMode;
  calculateSaju(input: UserProfileInput): SajuResult;
  calculateCompatibility(me: PairInput, partner: PairInput): CompatibilityResult;
}
