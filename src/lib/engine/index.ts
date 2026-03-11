import { mockEngine } from "./mockEngine";
import { realProviderEngine } from "./realProviderEngine";
import { buildMockHomeNarrative } from "./homeNarrative";
import { buildMockPersonaNarrative } from "./personaNarrative";
import { recordProviderState } from "./observability";
import type { EngineMode, PairInput, SajuEngine } from "./types";
import type { UserProfileInput } from "../../types/saju";

const DEFAULT_MODE: EngineMode = "real-provider";

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
  const result = await getEngine(mode).calculateSaju(input);
  recordProviderState("saju", result.providerState);
  return result;
}

export async function calculateCompatibilityWithEngine(me: PairInput, partner: PairInput, mode?: EngineMode) {
  const result = await getEngine(mode).calculateCompatibility(me, partner);
  recordProviderState("compatibility", result.providerState);
  return result;
}

export async function calculateHomeNarrativeWithEngine(input: UserProfileInput, mode?: EngineMode) {
  const engine = getEngine(mode);
  if (engine.calculateHomeNarrative) {
    return engine.calculateHomeNarrative(input);
  }

  const saju = await engine.calculateSaju(input);
  return buildMockHomeNarrative(input, saju.providerState, { saju });
}

export async function calculatePersonaNarrativeWithEngine(input: UserProfileInput, mode?: EngineMode) {
  const engine = getEngine(mode);
  if (engine.calculatePersonaNarrative) {
    return engine.calculatePersonaNarrative(input);
  }

  const saju = await engine.calculateSaju(input);
  return buildMockPersonaNarrative(input, saju.providerState, { saju });
}

export type { EngineMode, PairInput, SajuEngine } from "./types";
export type { HomeNarrativeSnapshot, HomeTodayPoints, HomeTimeFlow, NarrativeConfidence } from "./homeNarrative";
export type { PersonaNarrativeSnapshot, PersonaTraits, PersonaNarrativeConfidence } from "./personaNarrative";
