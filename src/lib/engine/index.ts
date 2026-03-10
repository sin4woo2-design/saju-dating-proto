import { mockEngine } from "./mockEngine";
import { realProviderEngine } from "./realProviderEngine";
import { buildMockHomeNarrative } from "./homeNarrative";
import { buildMockPersonaNarrative } from "./personaNarrative";
import type { EngineMode, PairInput, SajuEngine } from "./types";
import type { UserProfileInput } from "../../types/saju";

const DEFAULT_MODE: EngineMode = "mock";

function normalizeMode(value: string | undefined): EngineMode {
  if (value === "real-provider" || value === "real-stub") return "real-provider";
  return DEFAULT_MODE;
}

export function getEngine(mode?: EngineMode): SajuEngine {
  const envMode = normalizeMode(import.meta.env.VITE_SAJU_ENGINE_MODE as string | undefined);
  const selected = mode ?? envMode;
  return selected === "real-provider" ? realProviderEngine : mockEngine;
}

export async function calculateSajuWithEngine(input: UserProfileInput, mode?: EngineMode) {
  return getEngine(mode).calculateSaju(input);
}

export async function calculateCompatibilityWithEngine(me: PairInput, partner: PairInput, mode?: EngineMode) {
  return getEngine(mode).calculateCompatibility(me, partner);
}

export async function calculateHomeNarrativeWithEngine(input: UserProfileInput, mode?: EngineMode) {
  const engine = getEngine(mode);
  if (engine.calculateHomeNarrative) {
    return engine.calculateHomeNarrative(input);
  }

  return buildMockHomeNarrative(input, engine.mode === "real-provider" ? "mock-fallback" : "mock");
}

export async function calculatePersonaNarrativeWithEngine(input: UserProfileInput, mode?: EngineMode) {
  const engine = getEngine(mode);
  if (engine.calculatePersonaNarrative) {
    return engine.calculatePersonaNarrative(input);
  }

  return buildMockPersonaNarrative(input, engine.mode === "real-provider" ? "mock-fallback" : "mock");
}

export type { EngineMode, PairInput, SajuEngine } from "./types";
export type { HomeNarrativeSnapshot, HomeTodayPoints, HomeTimeFlow, NarrativeConfidence } from "./homeNarrative";
export type { PersonaNarrativeSnapshot, PersonaTraits, PersonaNarrativeConfidence } from "./personaNarrative";
