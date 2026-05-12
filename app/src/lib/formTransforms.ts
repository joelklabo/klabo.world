export function splitTrimmedList(value: string, separator: string | RegExp): string[] {
  return value
    .split(separator)
    .map((entry) => entry.trim())
    .filter(Boolean);
}
