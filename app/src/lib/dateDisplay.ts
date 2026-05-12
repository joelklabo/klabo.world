export type DateInput = string | Date | null | undefined;

export function resolveDisplayDate(value: DateInput, fallback: DateInput = null): string {
  const resolved = value ?? fallback ?? '';
  return typeof resolved === 'string' ? resolved : resolved.toISOString();
}

export function getCurrentDateString(): string {
  return new Date().toISOString().slice(0, 10);
}

export function parseDateInput(value: DateInput): Date | undefined {
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? undefined : value;
  }
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

export function getDateTimeAttr(value: DateInput, fallback: DateInput = null): string {
  const resolved = resolveDisplayDate(value, fallback);
  const parsed = parseDateInput(resolved);
  return parsed ? parsed.toISOString() : resolved;
}

export function formatDisplayDate(
  value: DateInput,
  fallback: DateInput = null,
  options?: Intl.DateTimeFormatOptions,
  locale?: Intl.LocalesArgument,
): string {
  const resolved = resolveDisplayDate(value, fallback);
  const parsed = parseDateInput(resolved);
  if (!parsed) return resolved;
  try {
    return parsed.toLocaleDateString(locale, options);
  } catch {
    return parsed.toISOString().slice(0, 10);
  }
}

export function formatDisplayDateTime(
  value: DateInput,
  fallback: DateInput = null,
  options?: Intl.DateTimeFormatOptions,
  locale?: Intl.LocalesArgument,
): string {
  const resolved = resolveDisplayDate(value, fallback);
  const parsed = parseDateInput(resolved);
  if (!parsed) return resolved;
  try {
    return parsed.toLocaleString(locale, options);
  } catch {
    return parsed.toString();
  }
}

export function formatUtcDate(value: DateInput, fallback: DateInput = null): string {
  const resolved = resolveDisplayDate(value, fallback);
  const parsed = parseDateInput(resolved);
  return parsed ? parsed.toUTCString() : resolved;
}
