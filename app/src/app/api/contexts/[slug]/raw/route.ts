import { NextRequest, NextResponse } from 'next/server';
import { getEditableContextBySlug, getPublishedContextBySlug } from '@/lib/contexts';

export const dynamic = 'force-dynamic';

type Params = {
  slug: string;
};

type RouteContext = {
  params: Promise<Params>;
};

export async function GET(_request: NextRequest, context: RouteContext) {
  const params = await context.params;
  const contentlayerContext = getPublishedContextBySlug(params.slug);
  const diskContext = contentlayerContext ? undefined : await getEditableContextBySlug(params.slug);
  const isPublishedDiskContext = diskContext && diskContext.isPublished !== false;

  if (!contentlayerContext && !isPublishedDiskContext) {
    return NextResponse.json({ error: 'Context not found' }, { status: 404 });
  }

  const rawBody = contentlayerContext ? contentlayerContext.body.raw : diskContext!.body;
  const slug = contentlayerContext?.slug ?? diskContext!.slug;

  const response = new NextResponse(rawBody, { status: 200 });
  response.headers.set('Content-Type', 'text/markdown; charset=utf-8');
  response.headers.set('Content-Disposition', `inline; filename="${slug}.md"`);
  return response;
}
