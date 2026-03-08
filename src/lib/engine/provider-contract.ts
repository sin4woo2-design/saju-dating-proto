import type { Gender } from "../../types/saju";

export type ProviderWarningCode =
  | "PROVIDER_TIMEOUT"
  | "PROVIDER_UNAVAILABLE"
  | "PROVIDER_BAD_RESPONSE"
  | "PROVIDER_PARTIAL_DATA";

export interface ProviderPersonInput {
  name?: string;
  birthDate: string;
  birthTime: string;
  gender: Gender;
  calendarType: "solar";
  timezone: string;
}

export interface ProviderSajuRequest {
  person: ProviderPersonInput;
  options?: {
    includeSignals?: boolean;
    includeRawPillars?: boolean;
  };
}

export interface ProviderCompatibilityRequest {
  me: ProviderPersonInput;
  partner: ProviderPersonInput;
  options?: {
    includeSignals?: boolean;
  };
}

export interface ProviderMeta {
  providerVersion: string;
  requestId: string;
  latencyMs?: number;
}

export interface ProviderSajuResponse {
  meta: ProviderMeta;
  saju: {
    fiveElements?: Partial<Record<"wood" | "fire" | "earth" | "metal" | "water", number>>;
    pillars?: {
      year?: string;
      month?: string;
      day?: string;
      hour?: string;
    };
    signals?: string[];
  };
  warnings?: ProviderWarningCode[];
}

export interface ProviderCompatibilityResponse {
  meta: ProviderMeta;
  compatibility: {
    score?: number;
    signals?: string[];
  };
  warnings?: ProviderWarningCode[];
}
