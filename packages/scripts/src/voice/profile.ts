import path from 'node:path';
import {
  loadCorpus,
  loadVoiceConfig,
  resolveRepoRoot,
  sentenceSplit,
  stripMdx,
  writeJsonFile,
} from './shared.ts';

type VoiceProfile = {
  generatedAt: string;
  corpus: {
    postCount: number;
    excluded: string[];
  };
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

function median(values: number[]): number {
  if (values.length === 0) return 0;
  const sorted = [...values].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  if (sorted.length % 2 === 0) {
    return (sorted[mid - 1] + sorted[mid]) / 2;
  }
  return sorted[mid];
}

function countHeadings(body: string): { total: number; normalized: string[] } {
  const matches = body.match(/^#{1,6}\s+.+$/gm) ?? [];
  const normalized = matches
    .map((line) => line.replace(/^#{1,6}\s+/, '').trim())
    .map((h) => h.replace(/\s+/g, ' '));
  return { total: matches.length, normalized };
}

function hasToc(body: string): boolean {
  return /^##\s+Contents\b/m.test(body) || /^##\s+Table of Contents\b/m.test(body);
}

export async function main() {
  const repoRoot = await resolveRepoRoot();
  const config = await loadVoiceConfig(repoRoot);
  const corpus = await loadCorpus(repoRoot);

  const wordCounts: number[] = [];
  const sentenceWordCounts: number[] = [];
  const headingsPerPost: number[] = [];
  const headingCounts = new Map<string, number>();

  let tocCount = 0;
  let codeBlockCount = 0;
  let blockquoteCount = 0;

  for (const doc of corpus) {
    const text = stripMdx(doc.body);
    const words = text.length === 0 ? 0 : text.split(' ').length;
    wordCounts.push(words);

    const sentences = sentenceSplit(text);
    for (const sentence of sentences) {
      const w = sentence.split(/\s+/).filter(Boolean).length;
      if (w > 0) sentenceWordCounts.push(w);
    }

    const headings = countHeadings(doc.body);
    headingsPerPost.push(headings.total);
    for (const heading of headings.normalized) {
      headingCounts.set(heading, (headingCounts.get(heading) ?? 0) + 1);
    }

    if (hasToc(doc.body)) tocCount += 1;
    if (/```/.test(doc.body)) codeBlockCount += 1;
    if (/^>\s+/m.test(doc.body)) blockquoteCount += 1;
  }

  const totalWords = wordCounts.reduce((a, b) => a + b, 0);
  const avgWordsPerPost = corpus.length === 0 ? 0 : totalWords / corpus.length;
  const avgSentenceWords =
    sentenceWordCounts.length === 0
      ? 0
      : sentenceWordCounts.reduce((a, b) => a + b, 0) / sentenceWordCounts.length;

  const commonHeadings = Array.from(headingCounts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15)
    .map(([heading, count]) => ({ heading, count }));

  const profile: VoiceProfile = {
    generatedAt: new Date().toISOString(),
    corpus: {
      postCount: corpus.length,
      excluded: config.exclude,
    },
    stats: {
      totalWords,
      avgWordsPerPost: Math.round(avgWordsPerPost),
      avgSentenceWords: Math.round(avgSentenceWords * 10) / 10,
      medianSentenceWords: median(sentenceWordCounts),
    },
    structure: {
      avgHeadingsPerPost:
        headingsPerPost.length === 0
          ? 0
          : Math.round(
              (headingsPerPost.reduce((a, b) => a + b, 0) / headingsPerPost.length) * 10,
            ) / 10,
      commonHeadings,
      tocUsageRate: corpus.length === 0 ? 0 : Math.round((tocCount / corpus.length) * 100) / 100,
      codeBlockRate:
        corpus.length === 0 ? 0 : Math.round((codeBlockCount / corpus.length) * 100) / 100,
      blockquoteRate:
        corpus.length === 0 ? 0 : Math.round((blockquoteCount / corpus.length) * 100) / 100,
    },
  };

  const outPath = path.join(repoRoot, config.voiceProfilePath);
  await writeJsonFile(outPath, profile);

  console.log(`✅ Wrote ${path.relative(repoRoot, outPath)}`);
  console.log(`   Corpus posts: ${profile.corpus.postCount} (excluded: ${profile.corpus.excluded.join(', ')})`);
}

main().catch((err) => {
  console.error('[voice:profile] failed:', err);
  process.exitCode = 1;
});
