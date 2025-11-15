import { NextRequest, NextResponse } from 'next/server';
import { getPublishedContextBySlug, toContextMetadata } from '@/lib/contexts';
import { renderMarkdownPreview } from '@/lib/markdownPreview';

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
  const metadata = toContextMetadata(contextEntry);
  const htmlContent = await renderMarkdownPreview(contextEntry.body.raw);
  return NextResponse.json({
    metadata,
    content: contextEntry.body.raw,
    htmlContent,
  });
}
