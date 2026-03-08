import type { SajuEngine } from "./types";
import { mockEngine } from "./mockEngine";

/**
 * 실제 명리 엔진 연동 전 인터페이스/흐름 검증용 스텁.
 * - 현재는 UI/호출부를 깨지 않도록 mock 엔진으로 폴백
 * - 추후 이 파일만 교체하면 실엔진 전환 가능하도록 분리
 */
export const realEngineStub: SajuEngine = {
  mode: "real-stub",
  calculateSaju(input) {
    const fallback = mockEngine.calculateSaju(input);
    return {
      source: "real-stub",
      profile: fallback.profile,
      warnings: [
        "REAL_ENGINE_NOT_CONNECTED",
        "Currently falling back to mock profile output",
      ],
    };
  },
  calculateCompatibility(me, partner) {
    const fallback = mockEngine.calculateCompatibility(me, partner);
    return {
      source: "real-stub",
      score: fallback.score,
      warnings: [
        "REAL_ENGINE_NOT_CONNECTED",
        "Currently falling back to mock compatibility output",
      ],
    };
  },
};
