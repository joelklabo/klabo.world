import { DEFAULT_LIGHTNING_NODE_COLOR, DEFAULT_LIGHTNING_NODE_HOST, DEFAULT_LIGHTNING_NODE_PORT, DEFAULT_LIGHTNING_NODE_PUBKEY, DEFAULT_LIGHTNING_NODE_ALIAS } from './site-config';

export type LightningNodeInput = {
  alias?: string;
  pubkey?: string;
  host?: string | null;
  port?: number | null;
  color?: string;
};

type LightningNodeIdentity = {
  alias: string;
  pubkey: string;
  host: string;
  port: number;
  color: string;
};

export const DEFAULT_LIGHTNING_NODE: LightningNodeIdentity = {
  alias: DEFAULT_LIGHTNING_NODE_ALIAS,
  pubkey: DEFAULT_LIGHTNING_NODE_PUBKEY,
  host: DEFAULT_LIGHTNING_NODE_HOST,
  port: DEFAULT_LIGHTNING_NODE_PORT,
  color: DEFAULT_LIGHTNING_NODE_COLOR,
};

export function resolveLightningNode(input?: LightningNodeInput | null): LightningNodeIdentity {
  return {
    alias: input?.alias ?? DEFAULT_LIGHTNING_NODE.alias,
    pubkey: input?.pubkey ?? DEFAULT_LIGHTNING_NODE.pubkey,
    host: input?.host ?? DEFAULT_LIGHTNING_NODE.host,
    port: input?.port ?? DEFAULT_LIGHTNING_NODE.port,
    color: input?.color ?? DEFAULT_LIGHTNING_NODE.color,
  };
}

export function buildLightningNodeUri({ pubkey, host, port = DEFAULT_LIGHTNING_NODE_PORT }: Pick<LightningNodeIdentity, 'pubkey' | 'host' | 'port'>) {
  if (!host) {
    return pubkey;
  }

  return `${pubkey}@${host}:${port}`;
}
