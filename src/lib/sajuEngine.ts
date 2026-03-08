import type { FiveElementsBalance, SajuProfile, UserProfileInput } from "../types/saju";
import { calculateSajuWithEngine } from "./engine";
import { getFiveElementsBalance, generatePersonalitySummary } from "./engine/mockEngine";

/**
 * Legacy export 유지: 기존 페이지 코드 호환용.
 * 실제 값은 엔진 라우터(engine/index.ts)를 통해 공급된다.
 */
export function calculateSaju(input: UserProfileInput): SajuProfile {
  return calculateSajuWithEngine(input).profile;
}

/**
 * 아래 함수들은 기존 mock helper를 유지 노출.
 * (UI 표시/테스트에 사용 중인 레거시 의존성 보호)
 */
export { getFiveElementsBalance, generatePersonalitySummary };

export type { FiveElementsBalance };
