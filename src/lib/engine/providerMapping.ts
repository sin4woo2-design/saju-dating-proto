import type { SajuProfile } from "../../types/saju";
import type {
  ProviderCompatibilityResponse,
  ProviderSajuResponse,
  ProviderWarningCode,
} from "./provider-contract";

const ELEMENT_KEYS = ["wood", "fire", "earth", "metal", "water"] as const;
const DEFAULT_ELEMENT = 50;
const DEFAULT_COMPAT_SCORE = 72;

function clamp100(value: number) {
  return Math.max(0, Math.min(100, value));
}

export function mapProviderWarnings(raw?: ProviderWarningCode[]): string[] | undefined {
  if (!raw?.length) return undefined;
  return raw;
}

export function mapProviderSajuResponseToProfile(raw: ProviderSajuResponse): {
  fiveElements: SajuProfile["fiveElements"];
  warnings?: string[];
} {
  const warnings = new Set<string>(mapProviderWarnings(raw.warnings) ?? []);
  const source = raw.saju.fiveElements ?? {};

  const fiveElements = {
    wood: DEFAULT_ELEMENT,
    fire: DEFAULT_ELEMENT,
    earth: DEFAULT_ELEMENT,
    metal: DEFAULT_ELEMENT,
    water: DEFAULT_ELEMENT,
  };

  for (const key of ELEMENT_KEYS) {
    const value = source[key];
    if (typeof value === "number") {
      fiveElements[key] = clamp100(value);
    } else {
      warnings.add("PROVIDER_PARTIAL_DATA");
    }
  }

  return {
    fiveElements,
    warnings: warnings.size ? Array.from(warnings) : undefined,
  };
}

export function mapProviderCompatibilityToScore(raw: ProviderCompatibilityResponse): {
  score: number;
  warnings?: string[];
} {
  const warnings = new Set<string>(mapProviderWarnings(raw.warnings) ?? []);
  const score = raw.compatibility.score;

  if (typeof score !== "number") {
    warnings.add("PROVIDER_PARTIAL_DATA");
    return {
      score: DEFAULT_COMPAT_SCORE,
      warnings: Array.from(warnings),
    };
  }

  return {
    score: clamp100(score),
    warnings: warnings.size ? Array.from(warnings) : undefined,
  };
}
