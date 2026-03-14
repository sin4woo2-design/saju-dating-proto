import type { ProviderState } from "./types";

type EngineMetricKind = "saju" | "compatibility";

interface ChartMetaSample {
  ruleVersion?: string;
  calculationSource?: string;
}

const metricStore: Record<EngineMetricKind, { total: number; nonProvider: number }> = {
  saju: { total: 0, nonProvider: 0 },
  compatibility: { total: 0, nonProvider: 0 },
};

const warningCounts: Record<string, number> = {};
const chartMetaCounts: Record<string, number> = {};

export interface EngineObserveSnapshot {
  providerState: Record<EngineMetricKind, { total: number; nonProvider: number; nonProviderRatio: number }>;
  warningCounts: Record<string, number>;
  chartMetaCounts: Record<string, number>;
}

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

export function recordChartMeta(meta?: ChartMetaSample) {
  if (!meta) return;
  const key = `${meta.calculationSource ?? "unknown-source"}::${meta.ruleVersion ?? "unknown-rule"}`;
  chartMetaCounts[key] = (chartMetaCounts[key] ?? 0) + 1;

  if (chartMetaCounts[key] === 1 || chartMetaCounts[key] % 20 === 0) {
    console.info(`[engine-observe] chart meta ${key} seen ${chartMetaCounts[key]} times`);
  }
}

export function getEngineObserveSnapshot(): EngineObserveSnapshot {
  const providerState = {
    saju: {
      total: metricStore.saju.total,
      nonProvider: metricStore.saju.nonProvider,
      nonProviderRatio: metricStore.saju.total ? metricStore.saju.nonProvider / metricStore.saju.total : 0,
    },
    compatibility: {
      total: metricStore.compatibility.total,
      nonProvider: metricStore.compatibility.nonProvider,
      nonProviderRatio: metricStore.compatibility.total ? metricStore.compatibility.nonProvider / metricStore.compatibility.total : 0,
    },
  } satisfies EngineObserveSnapshot["providerState"];

  return {
    providerState,
    warningCounts: { ...warningCounts },
    chartMetaCounts: { ...chartMetaCounts },
  };
}

export function resetEngineObserveSnapshot() {
  metricStore.saju.total = 0;
  metricStore.saju.nonProvider = 0;
  metricStore.compatibility.total = 0;
  metricStore.compatibility.nonProvider = 0;

  Object.keys(warningCounts).forEach((k) => delete warningCounts[k]);
  Object.keys(chartMetaCounts).forEach((k) => delete chartMetaCounts[k]);
}
