// 테스트 프레임워크 도입 전 계약(Contract) 테스트 초안
// Vitest 도입 시 그대로 옮겨서 실행 가능하도록 작성

import { getEngine } from "./index";

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

export function draftContractCases() {
  const mock = getEngine("mock");
  const stub = getEngine("real-stub");

  const mockSaju = mock.calculateSaju(sampleMe);
  const stubSaju = stub.calculateSaju(sampleMe);

  const mockComp = mock.calculateCompatibility(sampleMe, samplePartner);
  const stubComp = stub.calculateCompatibility(sampleMe, samplePartner);

  return {
    cases: [
      {
        name: "mock engine returns 5-element profile",
        pass:
          Object.keys(mockSaju.profile.fiveElements).length === 5 &&
          mockSaju.source === "mock",
      },
      {
        name: "real-stub includes warning",
        pass:
          stubSaju.source === "real-stub" &&
          !!stubSaju.warnings?.includes("REAL_ENGINE_NOT_CONNECTED"),
      },
      {
        name: "compatibility score is bounded",
        pass:
          mockComp.score >= 0 && mockComp.score <= 100 &&
          stubComp.score >= 0 && stubComp.score <= 100,
      },
    ],
  };
}
