import { connect as netConnect } from 'node:net';
import { connect as tlsConnect } from 'node:tls';
import { isBlobConfigured, probeBlobContainer } from './blob-service';
import { probeDatabase } from './prisma';

type HealthComponentStatus = {
  status: 'ok' | 'failed' | 'skipped';
  message?: string;
  latencyMs?: number;
};

type HealthComponents = {
  db: HealthComponentStatus;
  redis: HealthComponentStatus;
  blob: HealthComponentStatus;
};

const DEFAULT_TIMEOUT_MS = 2000;
const CRLF = String.fromCodePoint(13, 10);

function getTimeoutMs() {
  const value = Number(process.env.HEALTHCHECK_TIMEOUT_MS);
  if (Number.isFinite(value) && value > 0) {
    return value;
  }
  return DEFAULT_TIMEOUT_MS;
}

async function withTimeout<T>(promise: Promise<T>, timeoutMs: number, label: string): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new Error(`${label} timed out after ${timeoutMs}ms`));
    }, timeoutMs);
  });

  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    if (timeoutId) {
      clearTimeout(timeoutId);
    }
  }
}

function errorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  return 'Unknown error';
}

async function runCheck(name: string, check: () => Promise<void>, timeoutMs: number): Promise<HealthComponentStatus> {
  const start = Date.now();
  try {
    await withTimeout(check(), timeoutMs, name);
    return { status: 'ok', latencyMs: Date.now() - start };
  } catch (error) {
    console.error(`[health] ${name} check failed`, error);
    return { status: 'failed', message: errorMessage(error), latencyMs: Date.now() - start };
  }
}

async function checkDatabase(timeoutMs = getTimeoutMs()): Promise<HealthComponentStatus> {
  return runCheck('db', () => probeDatabase(), timeoutMs);
}

function buildRespCommand(parts: string[]) {
  return `*${parts.length}${CRLF}${parts
    .map((part) => `$${Buffer.byteLength(part)}${CRLF}${part}${CRLF}`)
    .join('')}`;
}

async function pingRedis(url: string, timeoutMs: number) {
  return new Promise<void>((resolve, reject) => {
    let settled = false;
    const parsed = new URL(url);
    const port = parsed.port
      ? Number(parsed.port)
      : parsed.protocol === 'rediss:'
        ? 6380
        : 6379;
    const host = parsed.hostname;
    const useTls = parsed.protocol === 'rediss:';
    const socket = useTls
      ? tlsConnect({ host, port, servername: host })
      : netConnect({ host, port });

    const timeoutId = setTimeout(() => {
      socket.destroy();
      if (!settled) {
        settled = true;
        reject(new Error('redis ping timed out'));
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
        resolve();
      }
    };

    const commands: string[] = [];
    if (parsed.password) {
      const password = decodeURIComponent(parsed.password);
      if (parsed.username) {
        commands.push(buildRespCommand(['AUTH', decodeURIComponent(parsed.username), password]));
      } else {
        commands.push(buildRespCommand(['AUTH', password]));
      }
    }
    commands.push(buildRespCommand(['PING']));

    socket.on('error', (error) => finish(error instanceof Error ? error : new Error(String(error))));
    socket.on('connect', () => {
      socket.write(commands.join(''));
    });

    let buffer = '';
    socket.on('data', (data) => {
      buffer += data.toString('utf8');
      const lines = buffer.split(CRLF);
      buffer = lines.pop() ?? '';
      for (const line of lines) {
        if (line.startsWith('-')) {
          finish(new Error(line.slice(1)));
          return;
        }
        if (line.startsWith('+PONG')) {
          finish();
          return;
        }
      }
    });
  });
}

async function checkRedis(timeoutMs = getTimeoutMs()): Promise<HealthComponentStatus> {
  const redisUrl = process.env.REDIS_URL?.trim();
  if (!redisUrl) {
    return { status: 'skipped', message: 'REDIS_URL not configured' };
  }

  const start = Date.now();
  try {
    await withTimeout(pingRedis(redisUrl, timeoutMs), timeoutMs, 'redis ping');
    return { status: 'ok', latencyMs: Date.now() - start };
  } catch (error) {
    console.error('[health] redis check failed', error);
    return { status: 'failed', message: errorMessage(error), latencyMs: Date.now() - start };
  }
}

async function checkBlob(timeoutMs = getTimeoutMs()): Promise<HealthComponentStatus> {
  if (!isBlobConfigured()) {
    return { status: 'skipped', message: 'Azure storage not configured' };
  }

  return runCheck('blob', () => probeBlobContainer(), timeoutMs);
}

export async function runHealthChecks(): Promise<{ components: HealthComponents; hasFailure: boolean }> {
  const timeoutMs = getTimeoutMs();
  const [db, redis, blob] = await Promise.all([
    checkDatabase(timeoutMs),
    checkRedis(timeoutMs),
    checkBlob(timeoutMs),
  ]);

  const components: HealthComponents = { db, redis, blob };
  const hasFailure = Object.values(components).some((component) => component.status === 'failed');

  return { components, hasFailure };
}
