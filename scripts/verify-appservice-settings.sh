#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
FILE="$ROOT/infra/modules/appService.bicep"

export FILE
node - <<'NODE'
const fs = require('fs');

const file = process.env.FILE;
const text = fs.readFileSync(file, 'utf8');
const errors = [];

if (!text.includes("name: 'WEBSITES_ENABLE_APP_SERVICE_STORAGE'")) {
  errors.push('missing WEBSITES_ENABLE_APP_SERVICE_STORAGE app setting');
}

if (!/name: 'WEBSITES_ENABLE_APP_SERVICE_STORAGE'\s*value: 'true'/.test(text)) {
  errors.push("WEBSITES_ENABLE_APP_SERVICE_STORAGE is not set to 'true'");
}

if (!/\bcapacity:\s*1\b/.test(text)) {
  errors.push('App Service plan capacity is not pinned to 1');
}

if (errors.length) {
  console.error('App Service SQLite guard failed:');
  for (const err of errors) {
    console.error(`- ${err}`);
  }
  process.exit(1);
}

console.log('App Service SQLite guard OK.');
NODE
