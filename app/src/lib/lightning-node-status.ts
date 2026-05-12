import 'server-only';
import { connect as netConnect } from 'node:net';
import { buildLightningNodeUri } from './lightning-node-uri';
import { env } from './env';

export type LightningNodePublicStatus = {
  alias: string;
  pubkey: string;
  host: string;
  port: number;
  uri: string;
  reachable: boolean;
  latencyMs: number | null;
  checkedAt: string;
  source: 'tcp-connect';
};

function connectToNode(host: string, port: number, timeoutMs: number): Promise<number> {
  const start = Date.now();

  return new Promise((resolve, reject) => {
    let settled = false;
    const socket = netConnect({ host, port });
    const timeoutId = setTimeout(() => {
      socket.destroy();
      if (!settled) {
        settled = true;
        reject(new Error('node status check timed out'));
      }
    }, timeoutMs);

    const finish = (error?: Error) => {
      if (settled) {
        return;
      }
      settled = true;
      clearTimeout(timeoutId);
      socket.end();
      if (error) {
        reject(error);
      } else {
        resolve(Date.now() - start);
      }
    };

    socket.on('connect', () => finish());
    socket.on('error', (error) => finish(error instanceof Error ? error : new Error(String(error))));
  });
}

export async function getLightningNodeStatus(): Promise<LightningNodePublicStatus> {
  const alias = env.LIGHTNING_NODE_ALIAS;
  const pubkey = env.LIGHTNING_NODE_PUBKEY;
  const host = env.LIGHTNING_NODE_HOST;
  const port = env.LIGHTNING_NODE_PORT;
  const timeoutMs = env.LIGHTNING_NODE_STATUS_TIMEOUT_MS;
  const checkedAt = new Date().toISOString();
  const base = {
    alias,
    pubkey,
    host,
    port,
    uri: buildLightningNodeUri({ pubkey, host, port }),
    checkedAt,
    source: 'tcp-connect' as const,
  };

  try {
    const latencyMs = await connectToNode(host, port, timeoutMs);
    return { ...base, reachable: true, latencyMs };
  } catch {
    return { ...base, reachable: false, latencyMs: null };
  }
}
