import { mockEngine } from "./mockEngine";
import { realEngineStub } from "./realEngineStub";
import type { EngineMode, PairInput, SajuEngine } from "./types";
import type { UserProfileInput } from "../../types/saju";

const DEFAULT_MODE: EngineMode = "mock";

function normalizeMode(value: string | undefined): EngineMode {
  if (value === "real-stub") return "real-stub";
  return DEFAULT_MODE;
}

export function getEngine(mode?: EngineMode): SajuEngine {
  const envMode = normalizeMode(import.meta.env.VITE_SAJU_ENGINE_MODE as string | undefined);
  const selected = mode ?? envMode;
  return selected === "real-stub" ? realEngineStub : mockEngine;
}

export async function calculateSajuWithEngine(input: UserProfileInput, mode?: EngineMode) {
  return getEngine(mode).calculateSaju(input);
}

export async function calculateCompatibilityWithEngine(me: PairInput, partner: PairInput, mode?: EngineMode) {
  return getEngine(mode).calculateCompatibility(me, partner);
}

export type { EngineMode, PairInput, SajuEngine } from "./types";
