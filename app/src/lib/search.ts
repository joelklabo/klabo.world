import { getPosts } from './posts';
import { getApps } from './apps';

export type SearchResult = {
  type: 'post' | 'app';
  title: string;
  summary: string;
  url: string;
  tags: string[];
  match: 'title' | 'summary' | 'tags' | 'body';
  snippet?: string;
};

const MIN_QUERY_LENGTH = 2;

function normalize(term: string) {
  return term.trim().toLowerCase();
}

function includeTags(tags?: string[]): string[] {
  return tags?.map((tag) => tag.trim()).filter(Boolean) ?? [];
}

function asText(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length > 0;
}

function isValidUrl(value: unknown): value is string {
  return typeof value === 'string' && value.startsWith('/');
}

function scoreMatch(match: SearchResult['match']): number {
  switch (match) {
    case 'title': {
      return 0;
    }
    case 'summary': {
      return 1;
    }
    case 'tags': {
      return 2;
    }
    case 'body': {
      return 3;
    }
    default: {
      return 4;
    }
  }
}

function firstIndexOf(text: string | null | undefined, term: string) {
  if (typeof text !== 'string' || text.length === 0) return -1;
  return text.toLowerCase().indexOf(term);
}

function buildSnippet(text: string | null | undefined, term: string, maxLength = 140) {
  if (typeof text !== 'string' || text.length === 0) return '';
  const index = firstIndexOf(text, term);
  if (index < 0) {
    return text.slice(0, maxLength).trim();
  }
  const padding = 50;
  const start = Math.max(0, index - padding);
  const end = Math.min(text.length, index + term.length + padding);
  const snippet = text.slice(start, end).trim();
  const prefix = start > 0 ? '…' : '';
  const suffix = end < text.length ? '…' : '';
  return `${prefix}${snippet}${suffix}`;
}

function findPostMatch(post: ReturnType<typeof getPosts>[number], term: string) {
  if (firstIndexOf(post.title, term) >= 0) {
    return { match: 'title' as const, snippet: post.title };
  }
  if (firstIndexOf(post.summary, term) >= 0) {
    return { match: 'summary' as const, snippet: buildSnippet(post.summary, term) };
  }
  if (post.tags?.some((tag) => firstIndexOf(tag, term) >= 0)) {
    return { match: 'tags' as const, snippet: post.tags?.join(', ') };
  }
  if (firstIndexOf(post.body?.raw, term) >= 0) {
    return { match: 'body' as const, snippet: buildSnippet(post.body?.raw, term) };
  }
  return null;
}

function findAppMatch(app: ReturnType<typeof getApps>[number], term: string) {
  if (firstIndexOf(app.name, term) >= 0) {
    return { match: 'title' as const, snippet: app.name };
  }
  if (firstIndexOf(app.fullDescription, term) >= 0) {
    return { match: 'summary' as const, snippet: buildSnippet(app.fullDescription, term) };
  }
  if (app.features?.some((feature) => firstIndexOf(feature, term) >= 0)) {
    return { match: 'tags' as const, snippet: app.features?.join(', ') };
  }
  return null;
}

export function searchContent(term: string): SearchResult[] {
  try {
    const normalized = normalize(term);
    if (normalized.length < MIN_QUERY_LENGTH) {
      return [];
    }

    const postResults: SearchResult[] = getPosts().flatMap((post) => {
      const match = findPostMatch(post, normalized);
      if (!match) return [];
      const title = asText(post.title);
      const summary = asText(post.summary);
      const url = post.url;
      if (!isNonEmptyString(title) || !isValidUrl(url)) {
        return [];
      }
      return [
        {
          type: 'post' as const,
          title,
          summary,
          url,
          tags: includeTags(post.tags),
          match: match.match,
          snippet: match.snippet,
        },
      ];
    });

    const appResults: SearchResult[] = getApps().flatMap((app) => {
      const match = findAppMatch(app, normalized);
      if (!match) return [];
      const title = asText(app.name);
      const summary = asText(app.fullDescription);
      const url = app.url;
      if (!isNonEmptyString(title) || !isValidUrl(url)) {
        return [];
      }
      return [
        {
          type: 'app' as const,
          title,
          summary,
          url,
          tags: includeTags(app.features),
          match: match.match,
          snippet: match.snippet,
        },
      ];
    });

    const combined = [...postResults, ...appResults].map((result) => ({
      result,
      score: scoreMatch(result.match),
    }));

    return combined
      .sort((a, b) => a.score - b.score || a.result.title.localeCompare(b.result.title))
      .slice(0, 10)
      .map(({ result }) => result);
  } catch (error) {
    console.error('Search index error', { error, term });
    return [];
  }
}
