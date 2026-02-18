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

  const localNormalized = (() => {
    const trimmed = decoded.trim();
    const atParts = trimmed.split('@');
    if (atParts.length > 1) {
      return atParts[0] || trimmed;
    }

    const rawWithAt = trimmed.replaceAll(/%40/gi, '@');
    const rawAtParts = rawWithAt.split('@');
    return rawAtParts[0] || trimmed;
  })();

  return localNormalized;
}

export type MetadataPair = [string, string];

function toMetadataPairs(metadata: unknown): MetadataPair[] {
  if (typeof metadata === 'string') {
    try {
      const parsed = JSON.parse(metadata);
      return toMetadataPairs(parsed);
    } catch {
      return [];
    }
  }

  if (Array.isArray(metadata)) {
    const entries: MetadataPair[] = metadata
      .filter((item): item is [unknown, unknown] => Array.isArray(item) && item.length >= 2)
      .filter((item): item is MetadataPair => typeof item[0] === 'string')
      .map(([type, value]) => [String(type), String(value)]);

    return entries;
  }

  if (metadata && typeof metadata === 'object') {
    return Object.entries(metadata as Record<string, unknown>).map(([type, value]) => [
      type,
      typeof value === 'string' ? value : '',
    ]);
  }

  return [];
}

export function updateMetadataWithLightningAddress(metadata: unknown, requestedLightningAddress: string): string {
  const metadataPairs = toMetadataPairs(metadata);
  const normalizedPairs = [...metadataPairs];
  let hasIdentifier = false;
  let hasPlainText = false;

  for (let i = 0; i < normalizedPairs.length; i += 1) {
    const pair = normalizedPairs[i];
    if (pair[0] === 'text/identifier') {
      normalizedPairs[i] = ['text/identifier', requestedLightningAddress];
      hasIdentifier = true;
    } else if (pair[0] === 'text/plain') {
      normalizedPairs[i] = ['text/plain', `Payment to ${requestedLightningAddress}`];
      hasPlainText = true;
    }
  }

  if (!hasIdentifier) {
    normalizedPairs.push(['text/identifier', requestedLightningAddress]);
  }
  if (!hasPlainText) {
    normalizedPairs.push(['text/plain', `Payment to ${requestedLightningAddress}`]);
  }

  return JSON.stringify(normalizedPairs);
}
