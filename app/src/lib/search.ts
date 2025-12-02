import { getPosts } from './posts';
import { getApps } from './apps';

export type SearchResult = {
  type: 'post' | 'app';
  title: string;
  summary: string;
  url: string;
  tags: string[];
  highlight?: string;
};

const MIN_QUERY_LENGTH = 2;

function normalize(term: string) {
  return term.trim().toLowerCase();
}

function includeTags(tags?: string[]): string[] {
  return tags?.map((tag) => tag.trim()).filter(Boolean) ?? [];
}

function scoreMatch(title: string, summary: string, tags: string[], term: string): number {
  const lowerTitle = title.toLowerCase();
  const lowerSummary = summary.toLowerCase();
  if (lowerTitle.includes(term)) {
    return 0;
  }
  if (lowerSummary.includes(term)) {
    return 1;
  }
  if (tags.some((tag) => tag.toLowerCase().includes(term))) {
    return 2;
  }
  return 3;
}

export function searchContent(term: string): SearchResult[] {
  const normalized = normalize(term);
  if (normalized.length < MIN_QUERY_LENGTH) {
    return [];
  }

  const postResults: SearchResult[] = getPosts()
    .filter((post) => post.body.raw.toLowerCase().includes(normalized) || post.summary.toLowerCase().includes(normalized) || post.title.toLowerCase().includes(normalized) || post.tags?.some((tag) => tag.toLowerCase().includes(normalized)))
    .map((post) => ({
      type: 'post' as const,
      title: post.title,
      summary: post.summary,
      url: post.url,
      tags: includeTags(post.tags),
    }));

  const appResults: SearchResult[] = getApps()
    .filter((app) => app.fullDescription.toLowerCase().includes(normalized) || app.name.toLowerCase().includes(normalized))
    .map((app) => ({
      type: 'app' as const,
      title: app.name,
      summary: app.fullDescription,
      url: app.url,
      tags: includeTags(app.features),
    }));

  const combined = [...postResults, ...appResults].map((result) => ({
    result,
    score: scoreMatch(result.title, result.summary, result.tags, normalized),
  }));

  return combined
    .sort((a, b) => a.score - b.score || a.result.title.localeCompare(b.result.title))
    .slice(0, 10)
    .map(({ result }) => result);
}
