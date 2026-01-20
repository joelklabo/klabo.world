#!/usr/bin/env node
import { spawn } from 'node:child_process';

let args = process.argv.slice(2);
if (args[0] === '--') {
  args = args.slice(1);
}

const FIXED_PATH = '/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin';

const passthroughKeys = new Set([
  'HOME',
  'USER',
  'LOGNAME',
  'SHELL',
  'LANG',
  'LC_ALL',
  'TERM',
  'TMPDIR',
]);

const passthroughPrefixes = [
  'PNPM_',
  'NPM_CONFIG_',
  'NODE_',
  'BASELINE_',
  'ADMIN_',
  'NEXTAUTH_',
  'NOSTRSTACK_',
  'PLAYWRIGHT_',
];

const env = { PATH: FIXED_PATH };
for (const [key, value] of Object.entries(process.env)) {
  if (value == null) continue;
  if (passthroughKeys.has(key) || passthroughPrefixes.some((prefix) => key.startsWith(prefix))) {
    env[key] = value;
  }
}

const PNPM_BIN = process.env.PNPM_HOME ? `${process.env.PNPM_HOME}/pnpm` : 'pnpm';

const contentlayer = spawn(PNPM_BIN, ['exec', 'contentlayer', 'dev', '--clearCache'], {
  stdio: 'inherit',
  shell: false,
  env,
});

const next = spawn(PNPM_BIN, ['exec', 'next', 'dev', '--webpack', ...args], {
  stdio: 'inherit',
  shell: false,
  env,
});

function shutdown(signal) {
  // Ensure both processes terminate; ignore errors.
  try {
    next.kill(signal);
  } catch {}
  try {
    contentlayer.kill(signal);
  } catch {}
}

process.on('SIGINT', () => shutdown('SIGINT'));
process.on('SIGTERM', () => shutdown('SIGTERM'));

next.on('exit', (code) => {
  shutdown('SIGTERM');
  process.exit(code ?? 0);
});
