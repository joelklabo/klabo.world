#!/usr/bin/env tsx

const path = require('node:path');
const { pathToFileURL } = require('node:url');

async function main() {
  const envModuleUrl = pathToFileURL(
    path.resolve(__dirname, '..', 'packages', 'core', 'src', 'env.ts'),
  );
  const { loadEnv } = await import(envModuleUrl.href);
  loadEnv(process.env);
  console.log('Environment validation passed.');
}

main().catch((error) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error('Environment validation failed:', message);
  process.exit(1);
});
