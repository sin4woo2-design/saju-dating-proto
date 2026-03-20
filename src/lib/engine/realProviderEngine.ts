import type { PairInput, SajuEngine } from "./types";
import { mockEngine } from "./mockEngine";
import { createHttpProviderAdapter } from "./providerAdapter";
import { mapProviderCompatibilityToScore, mapProviderSajuResponseToProfile } from "./providerMapping";
import type { UserProfileInput } from "../../types/saju";
import type { CalendarType, ProviderPersonInput } from "./provider-contract";
import { buildProfileCopy, deriveSajuAnalysis } from "../sajuAnalysis";

const adapter = createHttpProviderAdapter();

function normalizeErrorToWarning(error: unknown): string {
  if (!(error instanceof Error)) return "PROVIDER_UNAVAILABLE";
  if (error.message.includes("PROVIDER_TIMEOUT") || error.message.includes("UPSTREAM_TIMEOUT")) return "PROVIDER_TIMEOUT";
  if (error.message.includes("INVALID_INPUT") || error.message.includes("UNSUPPORTED_")) return "PROVIDER_BAD_RESPONSE";
  return "PROVIDER_UNAVAILABLE";
}

function toProviderPerson(input: UserProfileInput | PairInput): ProviderPersonInput {
  return {
    name: "name" in input ? input.name : undefined,
    birthDate: input.birthDate,
    birthTime: input.birthTime || "12:00",
    birthTimeKnown: !!input.birthTime,
    gender: input.gender,
    calendarType: "solar" as CalendarType,
    timezone: "Asia/Seoul",
  };
}

export const realProviderEngine: SajuEngine = {
  mode: "real-provider",
  async calculateSaju(input) {
    const fallback = await mockEngine.calculateSaju(input);

    try {
      const raw = await adapter.calculateSaju({
        person: toProviderPerson(input),
        options: { includeSignals: true, includeRawPillars: true },
      });

      const mapped = mapProviderSajuResponseToProfile(raw);
      const analysis = deriveSajuAnalysis(mapped.fiveElements, mapped.chart.pillars);
      const copy = buildProfileCopy(mapped.fiveElements, analysis);

      return {
        source: "real-provider",
        providerState: "provider",
        profile: {
          fiveElements: mapped.fiveElements,
          personalitySummary: copy.personalitySummary,
          loveStyle: copy.loveStyle,
          idealTraits: copy.idealTraits,
          analysis,
        },
        warnings: mapped.warnings,
        chart: mapped.chart,
      };
    } catch (error) {
      return {
        source: "real-provider",
        providerState: "mock-fallback",
        profile: fallback.profile,
        warnings: [normalizeErrorToWarning(error), "FALLBACK_TO_MOCK_PROFILE"],
      };
    }
  },
  async calculateCompatibility(me, partner) {
    const fallback = await mockEngine.calculateCompatibility(me, partner);

    try {
      const raw = await adapter.calculateCompatibility({
        me: toProviderPerson(me),
        partner: toProviderPerson(partner),
        options: { includeSignals: true, includeRawSignals: true },
      });

      const mapped = mapProviderCompatibilityToScore(raw);
      return {
        source: "real-provider",
        providerState: "provider",
        score: mapped.score,
        totalScore: mapped.totalScore,
        subScores: mapped.subScores,
        basis: mapped.basis,
        confidence: mapped.confidence,
        provenance: mapped.provenance,
        warnings: mapped.warnings,
        rawSignals: mapped.rawSignals,
        reliability: mapped.reliability,
        scoreRuleVersion: mapped.scoreRuleVersion,
      };
    } catch (error) {
      return {
        source: "real-provider",
        providerState: "mock-fallback",
        score: fallback.score,
        warnings: [normalizeErrorToWarning(error), "FALLBACK_TO_MOCK_COMPATIBILITY"],
      };
    }
  },
};
