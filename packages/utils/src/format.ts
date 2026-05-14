/** Inclusive numeric clamp (useful for UI sliders, pagination). */
export function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/** Join with Oxford comma; empty → empty string. */
export function formatList(
  items: readonly string[],
  conjunction = "and",
): string {
  if (items.length === 0) return "";
  if (items.length === 1) return items[0]!;
  if (items.length === 2) return `${items[0]!} ${conjunction} ${items[1]!}`;
  const head = items.slice(0, -1).join(", ");
  const tail = items[items.length - 1]!;
  return `${head}, ${conjunction} ${tail}`;
}

/** Human-readable relative time using `Intl.RelativeTimeFormat`. */
export function formatRelativeTime(
  input: Date | number,
  now: Date | number = Date.now(),
  locale = "en",
): string {
  const t0 = typeof input === "number" ? input : input.getTime();
  const t1 = typeof now === "number" ? now : now.getTime();
  const diffMs = t0 - t1;
  const abs = Math.abs(diffMs);
  const rtf = new Intl.RelativeTimeFormat(locale, { numeric: "auto" });

  if (abs < 60_000) {
    return rtf.format(Math.round(diffMs / 1000), "second");
  }
  if (abs < 3_600_000) {
    return rtf.format(Math.round(diffMs / 60_000), "minute");
  }
  if (abs < 86_400_000) {
    return rtf.format(Math.round(diffMs / 3_600_000), "hour");
  }
  if (abs < 604_800_000) {
    return rtf.format(Math.round(diffMs / 86_400_000), "day");
  }
  if (abs < 2_592_000_000) {
    return rtf.format(Math.round(diffMs / 604_800_000), "week");
  }
  if (abs < 31_536_000_000) {
    return rtf.format(Math.round(diffMs / 2_592_000_000), "month");
  }
  return rtf.format(Math.round(diffMs / 31_536_000_000), "year");
}
