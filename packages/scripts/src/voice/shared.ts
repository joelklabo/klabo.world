import { promises as fs } from 'node:fs';
import path from 'node:path';

export type VoiceConfig = {
  postsDir: string;
  exclude: string[];
  voiceProfilePath: string;
  voiceGuidePath: string;
  llmTellsPath: string;
  decisionsPath: string;
};

export type ParsedMdx = {
  filePath: string;
  filename: string;
  frontmatterRaw: string | null;
  body: string;
};

export type LlmTellsConfig = {
  version: number;
  source?: Record<string, unknown>;
  rules: Array<{
    id: string;
    severity: 'info' | 'warn' | 'error';
    description: string;
    patterns: string[];
  }>;
};

export async function readJsonFile<T>(filePath: string): Promise<T> {
  const raw = await fs.readFile(filePath, 'utf8');
  return JSON.parse(raw) as T;
}

export async function writeJsonFile(filePath: string, value: unknown) {
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, JSON.stringify(value, null, 2) + '\n', 'utf8');
}

export async function listMdxFiles(dir: string): Promise<string[]> {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries) {
    if (!entry.isFile()) continue;
    if (!entry.name.endsWith('.mdx')) continue;
    files.push(path.join(dir, entry.name));
  }
  files.sort();
  return files;
}

export function parseMdx(raw: string, filePath: string): ParsedMdx {
  const filename = path.basename(filePath);
  if (raw.startsWith('---\n')) {
    const endIndex = raw.indexOf('\n---\n', 4);
    if (endIndex !== -1) {
      const frontmatterRaw = raw.slice(4, endIndex);
      const body = raw.slice(endIndex + '\n---\n'.length);
      return { filePath, filename, frontmatterRaw, body };
    }
  }
  return { filePath, filename, frontmatterRaw: null, body: raw };
}

export function stripMdx(body: string): string {
  return body
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\[([^\]]+)\]\([^\)]+\)/g, '$1')
    .replace(/[#>*_`\-]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function sentenceSplit(text: string): string[] {
  return text
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

export function countRegex(text: string, re: RegExp): number {
  const matches = text.match(re);
  return matches ? matches.length : 0;
}

export async function resolveRepoRoot(startDir: string = process.cwd()): Promise<string> {
  let current = startDir;
  for (let i = 0; i < 6; i += 1) {
    const candidate = path.join(current, 'content/voice/config.json');
    try {
      await fs.access(candidate);
      return current;
    } catch {
      // keep searching
    }

    const parent = path.dirname(current);
    if (parent === current) break;
    current = parent;
  }

  throw new Error(
    `Could not locate repo root from ${startDir}. Expected to find content/voice/config.json in a parent directory.`,
  );
}

export async function loadVoiceConfig(repoRoot: string): Promise<VoiceConfig> {
  const configPath = path.join(repoRoot, 'content/voice/config.json');
  return readJsonFile<VoiceConfig>(configPath);
}

export async function loadCorpus(repoRoot: string): Promise<ParsedMdx[]> {
  const config = await loadVoiceConfig(repoRoot);
  const postsDir = path.join(repoRoot, config.postsDir);
  const files = await listMdxFiles(postsDir);
  const excluded = new Set(config.exclude);

  const corpusFiles = files.filter((filePath) => !excluded.has(path.basename(filePath)));

  const docs: ParsedMdx[] = [];
  for (const filePath of corpusFiles) {
    const raw = await fs.readFile(filePath, 'utf8');
    docs.push(parseMdx(raw, filePath));
  }
  return docs;
}

export function replaceManagedBlock(md: string, blockId: string, content: string): string {
  const begin = `<!-- VOICE:MANAGED:BEGIN(${blockId}) -->`;
  const end = `<!-- VOICE:MANAGED:END(${blockId}) -->`;
  const startIndex = md.indexOf(begin);
  const endIndex = md.indexOf(end);

  if (startIndex !== -1 && endIndex !== -1 && endIndex > startIndex) {
    const before = md.slice(0, startIndex + begin.length);
    const after = md.slice(endIndex);
    return `${before}\n\n${content.trim()}\n\n${after}`;
  }

  return `${md.trim()}\n\n${begin}\n\n${content.trim()}\n\n${end}\n`;
}
