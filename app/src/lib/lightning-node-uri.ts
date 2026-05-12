import { DEFAULT_LIGHTNING_NODE_PORT } from './site-config';

type LightningNodeIdentity = {
  pubkey: string;
  host?: string | null;
  port?: number | null;
};

export function buildLightningNodeUri({ pubkey, host, port = DEFAULT_LIGHTNING_NODE_PORT }: LightningNodeIdentity) {
  if (!host) {
    return pubkey;
  }

  return `${pubkey}@${host}:${port}`;
}
