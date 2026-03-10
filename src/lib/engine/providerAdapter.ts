import type {
  ProviderCompatibilityRequest,
  ProviderCompatibilityResponse,
  ProviderErrorResponse,
  ProviderSajuRequest,
  ProviderSajuResponse,
} from "./provider-contract";

export interface ProviderAdapter {
  calculateSaju(request: ProviderSajuRequest): Promise<ProviderSajuResponse>;
  calculateCompatibility(request: ProviderCompatibilityRequest): Promise<ProviderCompatibilityResponse>;
}

function timeoutSignal(ms: number) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  return { signal: controller.signal, clear: () => clearTimeout(timer) };
}

async function postJson<TResponse>(baseUrl: string, path: string, payload: unknown, timeoutMs: number): Promise<TResponse> {
  const { signal, clear } = timeoutSignal(timeoutMs);

  try {
    const response = await fetch(`${baseUrl}${path}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
      signal,
    });

    const json = (await response.json()) as TResponse | ProviderErrorResponse;

    if (!response.ok) {
      const detail = (json as ProviderErrorResponse)?.error;
      throw new Error(detail?.code ?? `HTTP_${response.status}`);
    }

    return json as TResponse;
  } catch (error) {
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error("PROVIDER_TIMEOUT");
    }
    throw error;
  } finally {
    clear();
  }
}

function resolveProviderBaseUrl(): string {
  const configured = (import.meta.env.VITE_SAJU_PROVIDER_BASE_URL as string | undefined)?.trim();
  if (configured) return configured.replace(/\/$/, "");

  if (typeof window !== "undefined") {
    const host = window.location.hostname;
    if (host === "localhost" || host === "127.0.0.1") {
      return "http://localhost:8081";
    }
  }

  throw new Error("PROVIDER_BASE_URL_NOT_CONFIGURED");
}

export function createHttpProviderAdapter(): ProviderAdapter {
  const baseUrl = resolveProviderBaseUrl();
  const timeoutMs = Number(import.meta.env.VITE_SAJU_PROVIDER_TIMEOUT_MS ?? 1500);

  return {
    calculateSaju(request) {
      return postJson<ProviderSajuResponse>(baseUrl, "/saju/chart", request, timeoutMs);
    },
    calculateCompatibility(request) {
      return postJson<ProviderCompatibilityResponse>(baseUrl, "/saju/compatibility-signals", request, timeoutMs);
    },
  };
}
