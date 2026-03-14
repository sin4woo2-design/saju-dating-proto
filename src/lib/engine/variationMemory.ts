const MAX_RECENT = 24;

function safeStorage(): Storage | null {
  if (typeof window === "undefined") return null;
  return window.localStorage;
}

function getKey(namespace: string, bucket: string) {
  return `variation-memory:${namespace}:${bucket}`;
}

function readRecent(namespace: string, bucket: string): string[] {
  const storage = safeStorage();
  if (!storage) return [];

  try {
    const raw = storage.getItem(getKey(namespace, bucket));
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((x) => typeof x === "string") : [];
  } catch {
    return [];
  }
}

function writeRecent(namespace: string, bucket: string, values: string[]) {
  const storage = safeStorage();
  if (!storage) return;

  try {
    storage.setItem(getKey(namespace, bucket), JSON.stringify(values.slice(-MAX_RECENT)));
  } catch {
    // noop
  }
}

export function pickWithRecencyGuard<T>(
  options: readonly T[],
  seed: number,
  fingerprint: (value: T) => string,
  namespace: string,
  bucket: string,
): T {
  if (!options.length) {
    throw new Error("pickWithRecencyGuard requires at least one option");
  }

  const recent = readRecent(namespace, bucket);

  for (let i = 0; i < options.length; i += 1) {
    const candidate = options[(Math.abs(seed) + i) % options.length];
    const fp = fingerprint(candidate);
    if (!recent.includes(fp)) {
      writeRecent(namespace, bucket, [...recent, fp]);
      return candidate;
    }
  }

  // all repeated; fallback to seeded pick and still track
  const fallback = options[Math.abs(seed) % options.length];
  writeRecent(namespace, bucket, [...recent, fingerprint(fallback)]);
  return fallback;
}
