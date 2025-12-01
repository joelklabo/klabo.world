import { NextRequest, NextResponse } from 'next/server';
import { env } from '@/lib/env';
import { promises as fs } from 'fs';
import path from 'path';

export const dynamic = 'force-dynamic';

type Params = {
  username: string;
  gistId: string;
};

type GitHubGistResponse = {
  description?: string | null;
  owner?: { login?: string | null } | null;
  files: Record<
    string,
    {
      filename: string;
      language: string | null;
      content: string;
    }
  >;
};

type RouteContext = {
  params: Promise<Params>;
};

async function readCachedGist(username: string, gistId: string) {
  const filePath = path.join(process.cwd(), 'app', 'data', 'gists', username, `${gistId}.json`);
  try {
    const raw = await fs.readFile(filePath, 'utf8');
    const parsed = JSON.parse(raw) as GitHubGistResponse['files'][string] & { description?: string | null };
    return parsed;
  } catch {
    return null;
  }
}

export async function GET(_request: NextRequest, context: RouteContext) {
  const params = await context.params;
  const url = `https://api.github.com/gists/${params.gistId}`;
  const headers: Record<string, string> = {
    'User-Agent': 'klabo-world-next',
    Accept: 'application/vnd.github.v3+json',
  };
  if (env.GITHUB_TOKEN) {
    headers.Authorization = `Bearer ${env.GITHUB_TOKEN}`;
  }
  try {
    const response = await fetch(url, { headers });
    if (response.ok) {
      const data = (await response.json()) as GitHubGistResponse;
      if (data.owner?.login && data.owner.login.toLowerCase() !== params.username.toLowerCase()) {
        return NextResponse.json({ error: 'Gist not found' }, { status: 404 });
      }
      const file = Object.values(data.files ?? {})[0];
      if (file) {
        return NextResponse.json({
          description: data.description ?? '',
          filename: file.filename,
          language: file.language ?? 'plaintext',
          content: file.content,
        });
      }
    }
  } catch (error) {
    console.warn('gist fetch failed; falling back to cache', error);
  }

  const cached = await readCachedGist(params.username, params.gistId);
  if (cached) {
    return NextResponse.json({
      description: cached.description ?? '',
      filename: cached.filename,
      language: cached.language ?? 'plaintext',
      content: cached.content,
      cached: true,
    });
  }

  return NextResponse.json({ error: 'Gist not found' }, { status: 502 });
}
