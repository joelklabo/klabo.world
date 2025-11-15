import { NextRequest, NextResponse } from 'next/server';
import { env } from '@/lib/env';

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
  const response = await fetch(url, { headers });
  if (!response.ok) {
    return NextResponse.json({ error: 'Gist not found' }, { status: response.status === 404 ? 404 : 502 });
  }
  const data = (await response.json()) as GitHubGistResponse;
  if (data.owner?.login && data.owner.login.toLowerCase() !== params.username.toLowerCase()) {
    return NextResponse.json({ error: 'Gist not found' }, { status: 404 });
  }
  const file = Object.values(data.files ?? {})[0];
  if (!file) {
    return NextResponse.json({ error: 'No files in gist' }, { status: 404 });
  }
  return NextResponse.json({
    description: data.description ?? '',
    filename: file.filename,
    language: file.language ?? 'plaintext',
    content: file.content,
  });
}
