import { performance } from 'node:perf_hooks';
import { createClient, type RedisClientType } from 'redis';
import { env } from '../env';
import { logger } from '../logger';
import { flagRegistry, validateRegistry } from './registry';
import {
  FlagAdapter,
  FlagAdapterResult,
  FlagDefinition,
  FlagEvaluation,
  FlagEvaluationContext,
  FlagSource,
  FlagValue,
} from './types';

type RedisLike = Pick<RedisClientType, 'get' | 'mGet' | 'keys' | 'isOpen' | 'connect'>;

const REDIS_PREFIX = 'feature-flags:';

const parsedOverrides: Record<string, FlagValue> = (() => {
  if (!env.FEATURE_FLAGS_JSON) {
    return {};
  }
  try {
    const value = JSON.parse(env.FEATURE_FLAGS_JSON) as Record<string, FlagValue>;
    if (value && typeof value === 'object') {
      return value;
    }
  } catch (error) {
    logger.warn('Failed to parse FEATURE_FLAGS_JSON; ignoring overrides', {
      error: error instanceof Error ? error.message : String(error),
    });
  }
  return {};
})();

class MemoryFlagAdapter implements FlagAdapter {
  constructor(private overrides: Record<string, FlagValue>) {}

  async get(key: string): Promise<FlagAdapterResult | null> {
    if (key in this.overrides) {
      return { value: this.overrides[key], source: 'env' };
    }
    return null;
  }

  async getAll(prefix?: string): Promise<Record<string, FlagAdapterResult>> {
    const results: Record<string, FlagAdapterResult> = {};
    for (const [key, value] of Object.entries(this.overrides)) {
      if (!prefix || key.startsWith(prefix)) {
        results[key] = { value, source: 'env' };
      }
    }
    return results;
  }
}

class RedisFlagAdapter implements FlagAdapter {
  constructor(private client: RedisLike) {}

  private async ensureConnected() {
    if (!this.client.isOpen) {
      await this.client.connect();
    }
  }

  async get(key: string): Promise<FlagAdapterResult | null> {
    await this.ensureConnected();
    const raw = await this.client.get(REDIS_PREFIX + key);
    if (!raw) return null;

    const parsed = safelyParse(raw);
    return {
      value: parsed ?? raw,
      source: 'redis',
    };
  }

  async getAll(prefix?: string): Promise<Record<string, FlagAdapterResult>> {
    await this.ensureConnected();
    const pattern = REDIS_PREFIX + (prefix ? `${prefix}*` : '*');
    const keys = await this.client.keys(pattern);
    if (!keys.length) return {};
    const values = await this.client.mGet(keys);
    const results: Record<string, FlagAdapterResult> = {};
    keys.forEach((k, idx) => {
      const keyWithoutPrefix = k.replace(REDIS_PREFIX, '');
      const parsed = values[idx] ? safelyParse(values[idx] as string) : null;
      results[keyWithoutPrefix] = {
        value: parsed ?? values[idx],
        source: 'redis',
      };
    });
    return results;
  }
}

class ProviderFlagAdapter implements FlagAdapter {
  async get(): Promise<FlagAdapterResult | null> {
    return null;
  }

  async getAll(): Promise<Record<string, FlagAdapterResult>> {
    return {};
  }
}

function safelyParse(raw: string) {
  try {
    return JSON.parse(raw) as FlagValue;
  } catch {
    return null;
  }
}

function buildEvaluation(
  key: string,
  value: FlagValue,
  source: FlagSource,
  metadata: FlagDefinition,
): FlagEvaluation {
  const isKillSwitch =
    metadata.type === 'boolean' &&
    metadata.killSeverity !== 'none' &&
    value === false &&
    source !== 'default';

  return {
    key,
    value,
    source,
    metadata,
    isKillSwitch,
  };
}

function findDefinition(key: string): FlagDefinition {
  const match = flagRegistry.find((def) => def.key === key);
  if (!match) {
    throw new Error(`Unknown flag: ${key}`);
  }
  return match;
}

function activeAdapters(redisClient: RedisLike | null): FlagAdapter[] {
  const adapters: FlagAdapter[] = [];

  // Redis-first to allow global kill switches / shared rollout.
  if (redisClient) {
    adapters.push(new RedisFlagAdapter(redisClient));
  }

  adapters.push(new ProviderFlagAdapter());

  adapters.push(new MemoryFlagAdapter(parsedOverrides));

  return adapters;
}

const redisClient = env.REDIS_URL
  ? createClient({ url: env.REDIS_URL, socket: { reconnectStrategy: 'exponential' } })
  : null;

const adapters = activeAdapters(redisClient);

validateRegistry();

function logHeartbeat() {
  logger.info('feature-flags heartbeat', {
    adapterOrder: adapters.map((a) => a.constructor.name),
    flagCount: flagRegistry.length,
    redisEnabled: Boolean(redisClient),
  });
}

logHeartbeat();

export async function getFlag(
  key: string,
  ctx?: FlagEvaluationContext,
): Promise<FlagEvaluation> {
  const meta = findDefinition(key);
  const start = performance.now();

  for (const adapter of adapters) {
    try {
      const result = await adapter.get(key, ctx);
      if (result !== null) {
        maybeSampleEval(meta.key, result.source, result.value, ctx, performance.now() - start);
        return buildEvaluation(key, result.value, result.source, meta);
      }
    } catch (error) {
      logger.warn('flag adapter error', {
        key,
        adapter: adapter.constructor.name,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  }

  maybeSampleEval(meta.key, 'default', meta.defaultValue, ctx, performance.now() - start);
  return buildEvaluation(key, meta.defaultValue, 'default', meta);
}

export async function getAllFlags(prefix?: string): Promise<Record<string, FlagEvaluation>> {
  const definitions = flagRegistry.filter((def) => !prefix || def.key.startsWith(prefix));
  const results: Record<string, FlagEvaluation> = {};

  for (const def of definitions) {
    results[def.key] = await getFlag(def.key);
  }

  return results;
}

export async function withFlag<T>(
  key: string,
  fn: () => Promise<T>,
  ctx?: FlagEvaluationContext,
): Promise<T | null> {
  const evaluation = await getFlag(key, ctx);
  if (evaluation.value === true || evaluation.value === 'on') {
    return fn();
  }
  return null;
}

export function listExpiredFlags(referenceDate = new Date()): FlagDefinition[] {
  return flagRegistry.filter((def) => new Date(def.expiry) < referenceDate);
}

function maybeSampleEval(
  key: string,
  source: FlagSource,
  value: FlagValue,
  ctx: FlagEvaluationContext | undefined,
  latencyMs: number,
) {
  const shouldSample = Math.random() < 0.1;
  if (!shouldSample) return;

  logger.info('flag evaluation', {
    key,
    source,
    value,
    bucket: ctx?.userId ? 'user' : 'anon',
    latencyMs: Math.round(latencyMs),
  });
}
