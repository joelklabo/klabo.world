import { NextResponse } from 'next/server';
import { searchPublishedContexts, toContextMetadata } from '@/lib/contexts';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get('q')?.trim() ?? '';
  if (query.length < 2) {
    return NextResponse.json({ error: 'Search query must be at least 2 characters.' }, { status: 400 });
  }
  const matches = searchPublishedContexts(query).map(toContextMetadata);
  return NextResponse.json(matches);
}
