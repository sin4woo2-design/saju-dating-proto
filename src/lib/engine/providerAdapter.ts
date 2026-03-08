import type {
  ProviderCompatibilityRequest,
  ProviderCompatibilityResponse,
  ProviderSajuRequest,
  ProviderSajuResponse,
} from "./provider-contract";

export interface ProviderAdapter {
  calculateSaju(request: ProviderSajuRequest): Promise<ProviderSajuResponse>;
  calculateCompatibility(request: ProviderCompatibilityRequest): Promise<ProviderCompatibilityResponse>;
}

/**
 * 실제 provider 연결 전 어댑터 자리잡기용 noop.
 * 구현 단계에서 이 함수가 실제 HTTP/SDK 어댑터를 반환하도록 교체.
 */
export function createNoopProviderAdapter(): ProviderAdapter {
  return {
    async calculateSaju() {
      throw new Error("PROVIDER_UNAVAILABLE: adapter not implemented");
    },
    async calculateCompatibility() {
      throw new Error("PROVIDER_UNAVAILABLE: adapter not implemented");
    },
  };
}
