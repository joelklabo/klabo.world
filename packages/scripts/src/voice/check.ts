import { promises as fs } from 'node:fs';
import path from 'node:path';
import {
  countRegex,
  loadVoiceConfig,
  parseMdx,
  readJsonFile,
  resolveRepoRoot,
  sentenceSplit,
  stripMdx,
  type LlmTellsConfig,
} from './shared.ts';

type CliOptions = {
  file: string;
};

type Finding = {
  ruleId: string;
  severity: 'info' | 'warn' | 'error';
  description: string;
  matches: Array<{ pattern: string; count: number }>;
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
  return { file: args.file };
}

function buildSentenceMetrics(text: string) {
  const sentences = sentenceSplit(text);
  const sentenceWordCounts = sentences.map((s) => s.split(/\s+/).filter(Boolean).length).filter((n) => n > 0);
  const avgSentenceWords =
    sentenceWordCounts.length === 0
      ? 0
      : sentenceWordCounts.reduce((a, b) => a + b, 0) / sentenceWordCounts.length;
  return { sentenceCount: sentences.length, avgSentenceWords: Math.round(avgSentenceWords * 10) / 10 };
}

function findLlmTells(llmTells: LlmTellsConfig, text: string): Finding[] {
  const findings: Finding[] = [];
  for (const rule of llmTells.rules) {
    const matches = rule.patterns
      .map((pattern) => {
        const re = new RegExp(pattern, 'gi');
        return { pattern, count: countRegex(text, re) };
      })
      .filter((m) => m.count > 0);

    if (matches.length === 0) continue;

    findings.push({
      ruleId: rule.id,
      severity: rule.severity,
      description: rule.description,
      matches,
    });
  }
  return findings;
}

export async function main() {
  const repoRoot = await resolveRepoRoot();
  const config = await loadVoiceConfig(repoRoot);
  const options = parseArgs(process.argv.slice(2));

  const targetPath = path.isAbsolute(options.file) ? options.file : path.join(repoRoot, options.file);
  const raw = await fs.readFile(targetPath, 'utf8');
  const parsed = parseMdx(raw, targetPath);

  const llmTellsPath = path.join(repoRoot, config.llmTellsPath);
  const llmTells = await readJsonFile<LlmTellsConfig>(llmTellsPath);

  const plain = stripMdx(parsed.body);
  const metrics = buildSentenceMetrics(plain);

  const tells = findLlmTells(llmTells, plain);

  const report = {
    file: path.relative(repoRoot, targetPath),
    metrics: {
      words: plain.length === 0 ? 0 : plain.split(' ').length,
      sentenceCount: metrics.sentenceCount,
      avgSentenceWords: metrics.avgSentenceWords,
      headings: (parsed.body.match(/^#{1,6}\s+.+$/gm) ?? []).length,
      hasToc: /^##\s+Contents\b/m.test(parsed.body),
    },
    findings: tells,
  };

  console.log(JSON.stringify(report, null, 2));
}

main().catch((err) => {
  console.error('[voice:check] failed:', err);
  process.exitCode = 1;
});
