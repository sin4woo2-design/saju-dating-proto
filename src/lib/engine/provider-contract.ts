import type { Gender } from "../../types/saju";

export type ProviderWarningCode =
  | "PROVIDER_TIMEOUT"
  | "PROVIDER_UNAVAILABLE"
  | "PROVIDER_BAD_RESPONSE"
  | "PROVIDER_PARTIAL_DATA";

export type CalendarType = "solar" | "lunar";

export interface ProviderPersonInput {
  name?: string;
  birthDate: string;
  /**
   * HH:mm. 출생시간 미상일 때도 문자열은 항상 전달하며(기본 12:00),
   * 실제 미상 여부는 birthTimeKnown=false 로 전달한다.
   */
  birthTime: string;
  birthTimeKnown?: boolean;
  gender: Gender;
  calendarType: CalendarType;
  timezone: "Asia/Seoul" | "UTC" | string;
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

export type ProviderErrorCode =
  | "INVALID_INPUT"
  | "UNSUPPORTED_TIMEZONE"
  | "UNSUPPORTED_CALENDAR_TYPE"
  | "UPSTREAM_TIMEOUT"
  | "INTERNAL_ERROR";

export interface ProviderErrorResponse {
  error: {
    code: ProviderErrorCode;
    message: string;
    requestId: string;
    retryable: boolean;
  };
}
