import type { UserProfileInput } from "../types/saju";

export interface DailyFortuneScores {
  total: number;
  love: number;
  work: number;
  health: number;
}

function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value));
}

function buildSeed(me: UserProfileInput) {
  const today = new Date().toISOString().slice(0, 10);
  return `${me.birthDate}-${me.birthTime}-${today}`
    .split("")
    .reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
}

export function calculateDailyFortuneScores(me: UserProfileInput): DailyFortuneScores {
  const seed = buildSeed(me);

  // 단일 총운 점수(홈/상세 공통)
  const total = 62 + (seed % 34); // 62~95

  // 하위 운세는 총운 기반으로 파생(페이지 간 일관성 유지)
  const loveOffset = (seed % 11) - 5; // -5~+5
  const workOffset = ((seed * 3) % 13) - 6; // -6~+6
  const healthOffset = ((seed * 5) % 9) - 4; // -4~+4

  return {
    total,
    love: clamp(total + loveOffset, 50, 98),
    work: clamp(total + workOffset, 50, 98),
    health: clamp(total + healthOffset, 50, 98),
  };
}
