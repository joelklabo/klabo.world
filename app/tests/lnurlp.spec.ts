import { describe, expect, it } from 'vitest';
import { normalizeLnurlUsername, updateMetadataWithLightningAddress } from '../src/lib/lnurlp';

describe('lnurlp normalization', () => {
  it('normalizes lowercase input to local-part only', () => {
    expect(normalizeLnurlUsername('gary')).toBe('gary');
  });

  it('drops domain suffix from raw lightning addresses', () => {
    expect(normalizeLnurlUsername('Gary%40klabo.world')).toBe('Gary');
  });

  it('decodes and trims whitespace', () => {
    expect(normalizeLnurlUsername('  Hurt%40klabo.world  ')).toBe('Hurt');
  });
});

describe('lnurlp metadata update', () => {
  it('replaces existing metadata identifier and plain text entries', () => {
    const raw = '[["text/plain","Payment to joel@klabo.world"],["text/identifier","joel@klabo.world"]]';
    const next = updateMetadataWithLightningAddress(raw, 'Gary@klabo.world');
    const parsed = JSON.parse(next) as [string, string][];

    expect(parsed).toContainEqual(['text/identifier', 'Gary@klabo.world']);
    expect(parsed).toContainEqual(['text/plain', 'Payment to Gary@klabo.world']);
  });

  it('adds missing metadata fields for incomplete payloads', () => {
    const next = updateMetadataWithLightningAddress('[["description","old format"]]', 'Gary@klabo.world');
    const parsed = JSON.parse(next) as [string, string][];

    expect(parsed).toContainEqual(['text/plain', 'Payment to Gary@klabo.world']);
    expect(parsed).toContainEqual(['text/identifier', 'Gary@klabo.world']);
    expect(parsed).toContainEqual(['description', 'old format']);
  });
});

describe('lnurlp normalization edge cases', () => {
  it('handles encoded and double-encoded input', () => {
    expect(normalizeLnurlUsername('Gary%2540klabo.world')).toBe('Gary');
    expect(normalizeLnurlUsername('s%2540domain.org')).toBe('s');
    expect(normalizeLnurlUsername('Gary%40klabo.world')).toBe('Gary');
  });
});
