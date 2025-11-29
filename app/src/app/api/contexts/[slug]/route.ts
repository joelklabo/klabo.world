import { NextRequest, NextResponse } from 'next/server';
import { getEditableContextBySlug, getPublishedContextBySlug, toAdminContextMetadata, toContextMetadata } from '@/lib/contexts';
import { renderMarkdownPreview } from '@/lib/markdownPreview';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

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

  const metadata = contentlayerContext ? toContextMetadata(contentlayerContext) : toAdminContextMetadata(diskContext!);
  const rawBody = contentlayerContext ? contentlayerContext.body.raw : diskContext!.body;
  const htmlContent = await renderMarkdownPreview(rawBody);
  return NextResponse.json({
    metadata,
    content: rawBody,
    htmlContent,
  });
}
