// 테스트 프레임워크 도입 전 계약(Contract) 테스트 초안
// Vitest 도입 시 그대로 옮겨서 실행 가능하도록 작성

import { calculateHomeNarrativeWithEngine, calculatePersonaNarrativeWithEngine, getEngine } from "./index";
import { mapProviderCompatibilityToScore, mapProviderSajuResponseToProfile } from "./providerMapping";
import type { ProviderCompatibilityResponse, ProviderSajuResponse } from "./provider-contract";

const sampleMe = {
  name: "테스트",
  birthDate: "1990-01-01",
  birthTime: "12:00",
  gender: "male" as const,
};

const samplePartner = {
  birthDate: "1992-03-04",
  birthTime: "09:20",
  gender: "female" as const,
};

const sampleProviderSaju: ProviderSajuResponse = {
  meta: {
    providerVersion: "draft-v1",
    requestId: "req-saju-1",
  },
  saju: {
    fiveElements: {
      wood: 80,
      fire: 20,
      earth: 40,
    },
    signals: ["WOOD_STRONG"],
  },
};

const sampleProviderComp: ProviderCompatibilityResponse = {
  meta: {
    providerVersion: "draft-v1",
    requestId: "req-comp-1",
  },
  compatibility: {
    score: 87,
    rawSignals: [
      { code: "BRANCH_HAP_YEAR", category: "relation-branch", polarity: "positive", weight: 7 },
      { code: "STEM_HAP_DAY", category: "relation-stem", polarity: "positive", weight: 4 },
      { code: "RELIABILITY_TIME_UNKNOWN_ME", category: "reliability", polarity: "neutral", weight: -3 },
    ],
  },
};

export async function draftContractCases() {
  const mock = getEngine("mock");
  const stub = getEngine("real-provider");

  const mockSaju = await mock.calculateSaju(sampleMe);
  const stubSaju = await stub.calculateSaju(sampleMe);

  const mockComp = await mock.calculateCompatibility(sampleMe, samplePartner);
  const stubComp = await stub.calculateCompatibility(sampleMe, samplePartner);

  const mappedSaju = mapProviderSajuResponseToProfile(sampleProviderSaju);
  const mappedComp = mapProviderCompatibilityToScore(sampleProviderComp);
  const homeNarrative = await calculateHomeNarrativeWithEngine(sampleMe, "mock");
  const personaNarrative = await calculatePersonaNarrativeWithEngine(sampleMe, "mock");

  return {
    cases: [
      {
        name: "mock engine returns 5-element profile",
        pass:
          Object.keys(mockSaju.profile.fiveElements).length === 5 &&
          mockSaju.source === "mock",
      },
      {
        name: "real-provider provides source",
        pass: stubSaju.source === "real-provider",
      },
      {
        name: "compatibility score is bounded",
        pass:
          mockComp.score >= 0 && mockComp.score <= 100 &&
          stubComp.score >= 0 && stubComp.score <= 100,
      },
      {
        name: "provider saju mapping fills missing element keys with defaults",
        pass:
          Object.keys(mappedSaju.fiveElements).length === 5 &&
          !!mappedSaju.warnings?.includes("PROVIDER_PARTIAL_DATA"),
      },
      {
        name: "provider compatibility mapping derives score from raw signals",
        pass: mappedComp.score === 78 && mappedComp.scoreRuleVersion === "compat-v1-rawsignals",
      },
      {
        name: "home/persona narrative expose provenance + basis",
        pass: !!homeNarrative.provenance?.ruleVersion && !!homeNarrative.basis?.basisCodes?.length &&
          !!personaNarrative.provenance?.ruleVersion && !!personaNarrative.basis?.basisCodes?.length,
      },
    ],
  };
}
