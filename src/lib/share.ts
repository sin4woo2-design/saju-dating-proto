export async function shareOrCopy(payload: { title: string; text: string; url?: string }) {
  const canShare = typeof navigator !== "undefined" && typeof navigator.share === "function";

  if (canShare) {
    await navigator.share(payload);
    return "shared" as const;
  }

  const value = [payload.title, payload.text, payload.url].filter(Boolean).join("\n");
  if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(value);
  }

  return "copied" as const;
}
