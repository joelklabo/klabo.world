import { NextResponse } from 'next/server';
import { searchContent } from '@/lib/search';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const url = new URL(request.url);
  const queryParam = url.searchParams.get('q');
  const query = queryParam?.trim() ?? '';

  const acceptHeader = request.headers.get('accept') ?? '';
  const isHtmlNavigation = acceptHeader.includes('text/html') || request.headers.get('sec-fetch-mode') === 'navigate';
  if (isHtmlNavigation) {
    const target = new URL('/search', url.origin);
    if (queryParam) {
      target.searchParams.set('q', queryParam);
    }
    return NextResponse.redirect(target);
  }

  if (query.length < 2) {
    return NextResponse.json(
      { results: [], meta: { query, total: 0, minLength: 2 } },
      { status: 200 },
    );
  }

  const results = searchContent(query);
  return NextResponse.json({ results, meta: { query, total: results.length, minLength: 2 } });
}
