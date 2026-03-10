import type { PairInput, SajuEngine } from "./types";
import { mockEngine, buildProfileFromFiveElements } from "./mockEngine";
import { createHttpProviderAdapter } from "./providerAdapter";
import { mapProviderCompatibilityToScore, mapProviderSajuResponseToProfile } from "./providerMapping";
import type { UserProfileInput } from "../../types/saju";
import type { CalendarType, ProviderPersonInput } from "./provider-contract";

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

      return {
        source: "real-provider",
        providerState: "provider",
        profile: buildProfileFromFiveElements(mapped.fiveElements),
        warnings: mapped.warnings,
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
        warnings: mapped.warnings,
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
