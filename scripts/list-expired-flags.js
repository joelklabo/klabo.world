#!/usr/bin/env node
/* Lightweight checker to surface expired feature flags.
   Intended for CI or cron usage: exits 1 when expired flags are found. */

const fs = require('node:fs');
const path = require('node:path');

const registryPath = path.join(__dirname, '../app/src/lib/flags/registry.json');
const registry = JSON.parse(fs.readFileSync(registryPath, 'utf8'));

const today = new Date().toISOString().slice(0, 10);

const expired = registry.filter((flag) => flag.expiry && flag.expiry < today);

if (expired.length === 0) {
  console.log(`No expired flags as of ${today}. (${registry.length} flags scanned)`);
  process.exit(0);
}

console.error(`Expired flags as of ${today}:`);
for (const flag of expired) {
  console.error(`- ${flag.key} (owner: ${flag.owner}, expiry: ${flag.expiry}, issue: ${flag.issue})`);
}

process.exit(1);
