#!/usr/bin/env ts-node
import { spawnSync } from 'node:child_process';
import { existsSync } from 'node:fs';
import path from 'node:path';
const TEMPLATE_PATH = path.resolve(process.cwd(), 'infra/main.bicep');
const PARAM_FILE = process.argv[2] ?? path.resolve(process.cwd(), 'infra/envs/prod.json');
if (!existsSync(TEMPLATE_PATH)) {
    console.error(`Missing ${TEMPLATE_PATH}. Did you run this from the repo root?`);
    process.exit(1);
}
if (!existsSync(PARAM_FILE)) {
    console.error(`Parameter file not found: ${PARAM_FILE}`);
    process.exit(1);
}
function run(command, args) {
    console.log(`\n> ${command} ${args.join(' ')}`);
    const result = spawnSync(command, args, { stdio: 'inherit' });
    if (result.status !== 0) {
        process.exit(result.status ?? 1);
    }
}
run('az', ['bicep', 'install']);
run('az', ['deployment', 'sub', 'create', '--location', 'westus3', '--template-file', TEMPLATE_PATH, '--parameters', `@${PARAM_FILE}`]);
