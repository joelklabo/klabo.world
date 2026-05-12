import { NextResponse } from 'next/server';
import { renderMarkdownPreview } from '@/lib/markdownPreview';
import { runAdminRoute, AdminRouteError } from '@/lib/adminRouteHelpers';
import { withSpan } from '@/lib/telemetry';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request: Request) {
  return runAdminRoute(async () => {
    const payload = await request.json().catch(() => null);
    const content = typeof payload?.content === 'string' ? payload.content : '';
    if (!content.trim()) {
      throw new AdminRouteError('Content is required for preview.', 400);
    }

    const html = await withSpan('admin.preview.markdown', () => renderMarkdownPreview(content), {
      'preview.length': content.length,
    });
    return NextResponse.json({ html });
  });
}
