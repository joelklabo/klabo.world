type DateInput = string | null | undefined;

export function resolveDisplayDate(value: DateInput, fallback: DateInput = null): string {
  return value ?? fallback ?? '';
}

function toDate(value: string): Date | undefined {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

export function getDateTimeAttr(value: DateInput, fallback: DateInput = null): string {
  const resolved = resolveDisplayDate(value, fallback);
  const parsed = toDate(resolved);
  return parsed ? parsed.toISOString() : resolved;
}

export function formatDisplayDate(
  value: DateInput,
  fallback: DateInput = null,
  options?: Intl.DateTimeFormatOptions,
): string {
  const resolved = resolveDisplayDate(value, fallback);
  const parsed = toDate(resolved);
  if (!parsed) return resolved;
  try {
    return parsed.toLocaleDateString(undefined, options);
  } catch {
    return parsed.toISOString().slice(0, 10);
  }
}
