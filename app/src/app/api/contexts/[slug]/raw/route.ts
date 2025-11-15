import { NextRequest, NextResponse } from 'next/server';
import { getPublishedContextBySlug } from '@/lib/contexts';

export const dynamic = 'force-dynamic';

type Params = {
  slug: string;
};

type RouteContext = {
  params: Promise<Params>;
};

export async function GET(_request: NextRequest, context: RouteContext) {
  const params = await context.params;
  const contextEntry = getPublishedContextBySlug(params.slug);
  if (!contextEntry) {
    return NextResponse.json({ error: 'Context not found' }, { status: 404 });
  }
  const response = new NextResponse(contextEntry.body.raw, { status: 200 });
  response.headers.set('Content-Type', 'text/markdown; charset=utf-8');
  response.headers.set('Content-Disposition', `inline; filename="${contextEntry.slug}.md"`);
  return response;
}
