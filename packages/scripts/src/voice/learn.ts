import { promises as fs } from 'node:fs';
import path from 'node:path';
import { loadVoiceConfig, resolveRepoRoot } from './shared.ts';

type CliOptions = {
  file: string;
  notes?: string;
};

function parseArgs(argv: string[]): CliOptions {
  const args: Record<string, string> = {};
  for (let i = 0; i < argv.length; i += 1) {
    const arg = argv[i];
    if (arg === '--') continue;
    if (!arg.startsWith('--')) continue;
    const key = arg.slice(2);
    const value = argv[i + 1];
    if (!value || value.startsWith('--')) {
      throw new Error(`Missing value for --${key}`);
    }
    args[key] = value;
    i += 1;
  }

  if (!args.file) {
    throw new Error('Missing required --file argument');
  }

  return {
    file: args.file,
    notes: args.notes,
  };
}

export async function main() {
  const repoRoot = await resolveRepoRoot();
  const config = await loadVoiceConfig(repoRoot);
  const options = parseArgs(process.argv.slice(2));

  const entry = {
    at: new Date().toISOString(),
    file: options.file,
    notes: options.notes ?? null,
  };

  const decisionsPath = path.join(repoRoot, config.decisionsPath);
  await fs.mkdir(path.dirname(decisionsPath), { recursive: true });
  await fs.appendFile(decisionsPath, JSON.stringify(entry) + '\n', 'utf8');

  console.log(`✅ Appended decision log to ${path.relative(repoRoot, decisionsPath)}`);
}

main().catch((err) => {
  console.error('[voice:learn] failed:', err);
  process.exitCode = 1;
});
