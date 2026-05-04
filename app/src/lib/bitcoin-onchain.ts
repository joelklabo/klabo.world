import { env } from './env';

const FALLBACK_ADDRESS = 'bc1qzafw20xpesnvwup6gmtx38e5j6ddjjdpc0zh78';
const MAINNET_ADDRESS_PATTERN = /^(bc1[a-z0-9]{11,87}|[13][a-km-zA-HJ-NP-Z1-9]{25,34})$/;
const MS_PER_DAY = 24 * 60 * 60 * 1000;

export type BitcoinOnchainAddressSource = 'static' | 'rotating-pool';

export type BitcoinOnchainAddressInfo = {
  address: string;
  uri: string;
  source: BitcoinOnchainAddressSource;
  poolSize: number;
  rotation: 'none' | 'daily';
  index: number;
};

export function isBitcoinMainnetAddress(value: string): boolean {
  return MAINNET_ADDRESS_PATTERN.test(value.trim());
}

export function buildBitcoinUri(address: string): string {
  return `bitcoin:${address}`;
}

function normalizeAddress(value: string | undefined): string | null {
  const address = value?.trim();
  if (!address || !isBitcoinMainnetAddress(address)) {
    return null;
  }
  return address;
}

function parsePool(value: string | undefined): string[] {
  if (!value) {
    return [];
  }

  const addresses = value
    .split(/[\s,]+/)
    .map((item) => item.trim())
    .filter(Boolean)
    .filter(isBitcoinMainnetAddress);

  return [...new Set(addresses)];
}

function getUtcDayIndex(now: Date): number {
  return Math.floor(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()) / MS_PER_DAY);
}

export function getBitcoinOnchainAddress(now = new Date()): BitcoinOnchainAddressInfo {
  const defaultAddress = normalizeAddress(env.BITCOIN_ONCHAIN_ADDRESS) ?? FALLBACK_ADDRESS;
  const pool = parsePool(env.BITCOIN_ONCHAIN_ADDRESS_POOL);

  if (pool.length > 0) {
    const index = getUtcDayIndex(now) % pool.length;
    const address = pool[index] ?? defaultAddress;
    return {
      address,
      uri: buildBitcoinUri(address),
      source: 'rotating-pool',
      poolSize: pool.length,
      rotation: 'daily',
      index,
    };
  }

  return {
    address: defaultAddress,
    uri: buildBitcoinUri(defaultAddress),
    source: 'static',
    poolSize: 1,
    rotation: 'none',
    index: 0,
  };
}
