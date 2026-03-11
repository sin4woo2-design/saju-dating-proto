import type { ProviderState } from "./types";

type EngineMetricKind = "saju" | "compatibility";

const metricStore: Record<EngineMetricKind, { total: number; nonProvider: number }> = {
  saju: { total: 0, nonProvider: 0 },
  compatibility: { total: 0, nonProvider: 0 },
};

const warningCounts: Record<string, number> = {};

export function recordProviderState(kind: EngineMetricKind, providerState: ProviderState) {
  const bucket = metricStore[kind];
  bucket.total += 1;
  if (providerState !== "provider") bucket.nonProvider += 1;

  if (bucket.total >= 20) {
    const ratio = bucket.nonProvider / bucket.total;
    if (ratio > 0.05) {
      console.warn(`[engine-observe] ${kind} non-provider ratio high: ${(ratio * 100).toFixed(1)}% (${bucket.nonProvider}/${bucket.total})`);
    }
  }
}

export function recordWarnings(kind: EngineMetricKind, warnings?: string[]) {
  if (!warnings?.length) return;

  for (const code of warnings) {
    warningCounts[code] = (warningCounts[code] ?? 0) + 1;
    if (warningCounts[code] % 10 === 0) {
      console.warn(`[engine-observe] ${kind} warning ${code} seen ${warningCounts[code]} times`);
    }
  }
}
