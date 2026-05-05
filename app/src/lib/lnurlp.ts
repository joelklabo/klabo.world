export function normalizeLnurlUsername(rawUsername: string): string {
  const decoded = (() => {
    let value = rawUsername;
    for (let i = 0; i < 4; i += 1) {
      try {
        const next = decodeURIComponent(value);
        if (next === value) break;
        value = next;
      } catch {
        break;
      }
    }
    return value;
  })();

  const trimmed = decoded.trim().replaceAll(/%40/gi, '@');
  const [local] = trimmed.split('@');
  return local || trimmed;
}
