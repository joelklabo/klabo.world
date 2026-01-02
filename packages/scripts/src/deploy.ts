#!/usr/bin/env ts-node

import { spawnSync } from 'node:child_process';
import path from 'node:path';

const required = (key: string, fallback?: string): string => {
  const value = process.env[key] ?? fallback;
  if (!value) {
    console.error(`Missing required environment variable: ${key}`);
    process.exit(1);
  }
  return value;
};

const run = (command: string, args: string[], options: { cwd?: string; env?: NodeJS.ProcessEnv } = {}) => {
  console.log(`\n> ${command} ${args.join(' ')}`);
  const result = spawnSync(command, args, {
    stdio: 'inherit',
    env: { ...process.env, ...options.env },
    cwd: options.cwd ?? process.cwd(),
  });
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
};

const workspaceRoot = path.resolve(process.cwd());
const containerRegistry = required('CONTAINER_REGISTRY');
const imageName = required('IMAGE_NAME');
const imageTag = required('IMAGE_TAG', process.env.GITHUB_SHA);
const slotName = process.env.AZURE_SLOT_NAME ?? 'staging';
const webAppName = required('AZURE_WEBAPP_NAME');
const resourceGroup = required('AZURE_RESOURCE_GROUP');
const nextauthSecret = required('NEXTAUTH_SECRET');
const image = `${containerRegistry}/${imageName}:${imageTag}`;
const latestTag = process.env.IMAGE_LATEST_TAG ? `${containerRegistry}/${imageName}:${process.env.IMAGE_LATEST_TAG}` : undefined;

// Build the application (ensures Next.js standalone output is fresh)
run('pnpm', ['--filter', 'app', 'build'], { cwd: workspaceRoot, env: { ...process.env, NODE_ENV: 'production' } });

// Build and push the container image (BuildKit secret required by Dockerfile)
run(
  'docker',
  ['build', '--secret', 'id=NEXTAUTH_SECRET,env=NEXTAUTH_SECRET', '-t', image, '.'],
  { cwd: workspaceRoot, env: { ...process.env, NEXTAUTH_SECRET: nextauthSecret, DOCKER_BUILDKIT: '1' } },
);
if (latestTag) {
  run('docker', ['tag', image, latestTag]);
}
run('docker', ['push', image]);
if (latestTag) {
  run('docker', ['push', latestTag]);
}

// Run Prisma migrations if DATABASE_URL is provided
if (process.env.DATABASE_URL) {
  run('pnpm', ['--filter', 'app', 'exec', 'prisma', 'migrate', 'deploy'], {
    cwd: workspaceRoot,
    env: { ...process.env, NODE_ENV: 'production' },
  });
} else {
  console.log('DATABASE_URL not set; skipping prisma migrate deploy.');
}

// Configure staging slot to use the freshly pushed image
run('az', ['webapp', 'config', 'container', 'set', '--name', webAppName, '--resource-group', resourceGroup, '--slot', slotName, '--docker-custom-image-name', image, '--docker-registry-server-url', `https://${containerRegistry}`]);
run('az', ['webapp', 'restart', '--name', webAppName, '--resource-group', resourceGroup, '--slot', slotName]);

// Swap staging slot into production
run('az', ['webapp', 'deployment', 'slot', 'swap', '--name', webAppName, '--resource-group', resourceGroup, '--slot', slotName, '--target-slot', 'production']);

// Smoke test the production slot
if (process.env.SMOKE_BASE_URL) {
  run('./scripts/deploy-smoke.sh', [], {
    cwd: workspaceRoot,
    env: { ...process.env, SMOKE_BASE_URL: process.env.SMOKE_BASE_URL },
  });
} else {
  console.log('SMOKE_BASE_URL not set; skipping deploy smoke script.');
}
