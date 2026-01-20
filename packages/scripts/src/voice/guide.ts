import { promises as fs } from 'node:fs';
import path from 'node:path';
import {
  loadVoiceConfig,
  readJsonFile,
  replaceManagedBlock,
  resolveRepoRoot,
  writeJsonFile,
  type VoiceConfig,
} from './shared.ts';

type VoiceProfile = {
  generatedAt: string;
  corpus: { postCount: number; excluded: string[] };
  stats: {
    totalWords: number;
    avgWordsPerPost: number;
    avgSentenceWords: number;
    medianSentenceWords: number;
  };
  structure: {
    avgHeadingsPerPost: number;
    commonHeadings: Array<{ heading: string; count: number }>;
    tocUsageRate: number;
    codeBlockRate: number;
    blockquoteRate: number;
  };
};

function buildProfileSummary(profile: VoiceProfile): string {
  const lines: string[] = [];
  lines.push(`Generated: ${profile.generatedAt}`);
  lines.push(`Corpus posts: ${profile.corpus.postCount}`);
  lines.push(`Excluded: ${profile.corpus.excluded.join(', ') || '(none)'}`);
  lines.push('');
  lines.push('## Corpus stats');
  lines.push(`- Avg words/post: ${profile.stats.avgWordsPerPost}`);
  lines.push(`- Avg sentence length (words): ${profile.stats.avgSentenceWords}`);
  lines.push(`- Median sentence length (words): ${profile.stats.medianSentenceWords}`);
  lines.push('');
  lines.push('## Structure signals');
  lines.push(`- Avg headings/post: ${profile.structure.avgHeadingsPerPost}`);
  lines.push(`- TOC usage rate: ${Math.round(profile.structure.tocUsageRate * 100)}%`);
  lines.push(`- Code blocks rate: ${Math.round(profile.structure.codeBlockRate * 100)}%`);
  lines.push(`- Blockquotes rate: ${Math.round(profile.structure.blockquoteRate * 100)}%`);
  lines.push('');
  lines.push('## Common headings');
  for (const { heading, count } of profile.structure.commonHeadings) {
    lines.push(`- ${heading} (${count})`);
  }
  return lines.join('\n');
}

async function ensureVoiceProfile(repoRoot: string, config: VoiceConfig): Promise<string> {
  const profilePath = path.join(repoRoot, config.voiceProfilePath);
  try {
    await fs.access(profilePath);
    return profilePath;
  } catch {
    // If profile doesn't exist yet, create an empty placeholder.
    await writeJsonFile(profilePath, {
      generatedAt: new Date().toISOString(),
      corpus: { postCount: 0, excluded: config.exclude },
      stats: { totalWords: 0, avgWordsPerPost: 0, avgSentenceWords: 0, medianSentenceWords: 0 },
      structure: { avgHeadingsPerPost: 0, commonHeadings: [], tocUsageRate: 0, codeBlockRate: 0, blockquoteRate: 0 },
    });
    return profilePath;
  }
}

export async function main() {
  const repoRoot = await resolveRepoRoot();
  const config = await loadVoiceConfig(repoRoot);

  const profilePath = await ensureVoiceProfile(repoRoot, config);
  const profile = await readJsonFile<VoiceProfile>(profilePath);

  const guidePath = path.join(repoRoot, config.voiceGuidePath);
  const guideExists = await fs
    .access(guidePath)
    .then(() => true)
    .catch(() => false);

  const baseGuide = guideExists
    ? await fs.readFile(guidePath, 'utf8')
    : `# Voice Guide (klabo.world)\n\n<!-- VOICE:MANAGED:BEGIN(profile-summary) -->\n\n<!-- VOICE:MANAGED:END(profile-summary) -->\n`;

  const updated = replaceManagedBlock(baseGuide, 'profile-summary', buildProfileSummary(profile));
  await fs.mkdir(path.dirname(guidePath), { recursive: true });
  await fs.writeFile(guidePath, updated, 'utf8');

  console.log(`✅ Updated ${path.relative(repoRoot, guidePath)}`);
}

main().catch((err) => {
  console.error('[voice:guide] failed:', err);
  process.exitCode = 1;
});
