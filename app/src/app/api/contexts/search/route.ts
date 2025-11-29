import { NextResponse } from 'next/server';
import { getContextsForAdmin, searchPublishedContexts, toAdminContextMetadata, toContextMetadata } from '@/lib/contexts';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q')?.trim() ?? '';
  if (query.length < 2) {
    return NextResponse.json({ error: 'Search query must be at least 2 characters.' }, { status: 400 });
  }
  const normalizedQuery = query.toLowerCase();
  const results = searchPublishedContexts(query).map(toContextMetadata);
  const seen = new Set(results.map((match) => match.slug));

  const diskContexts = await getContextsForAdmin({ includeDrafts: false });
  for (const context of diskContexts) {
    if (seen.has(context.slug)) continue;
    const haystack = [context.title, context.summary, ...(context.tags ?? [])].join(' ').toLowerCase();
    if (haystack.includes(normalizedQuery)) {
      results.push(toAdminContextMetadata(context));
      seen.add(context.slug);
    }
    if (results.length >= 10) break;
  }

  return NextResponse.json(results.slice(0, 10));
}
