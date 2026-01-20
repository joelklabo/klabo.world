#!/usr/bin/env node
import { spawn } from 'node:child_process';

let args = process.argv.slice(2);
if (args[0] === '--') {
  args = args.slice(1);
}

const env = {
  ...process.env,
  PATH: '/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin',
};

const contentlayer = spawn('pnpm', ['exec', 'contentlayer', 'dev', '--clearCache'], {
  stdio: 'inherit',
  shell: false,
  env,
});

const next = spawn('pnpm', ['exec', 'next', 'dev', '--webpack', ...args], {
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
