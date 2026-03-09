import type { FiveElementsBalance, SajuProfile, UserProfileInput } from "../types/saju";
import { calculateSajuWithEngine } from "./engine";
import { getFiveElementsBalance, generatePersonalitySummary } from "./engine/mockEngine";

export async function calculateSajuResult(input: UserProfileInput) {
  return calculateSajuWithEngine(input);
}

/**
 * Legacy export 유지: 기존 페이지 코드 호환용.
 */
export async function calculateSaju(input: UserProfileInput): Promise<SajuProfile> {
  const result = await calculateSajuWithEngine(input);
  return result.profile;
}

export { getFiveElementsBalance, generatePersonalitySummary };
export type { FiveElementsBalance };
