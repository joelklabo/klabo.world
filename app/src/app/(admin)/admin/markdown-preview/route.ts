import { NextResponse } from 'next/server';
import { requireAdminSession } from '@/lib/adminSession';
import { renderMarkdownPreview } from '@/lib/markdownPreview';
import { withSpan } from '@/lib/telemetry';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function POST(request: Request) {
  await requireAdminSession();
  const payload = await request.json().catch(() => null);
  const content = typeof payload?.content === 'string' ? payload.content : '';
  if (!content.trim()) {
    return NextResponse.json({ error: 'Content is required for preview.' }, { status: 400 });
  }

  try {
    const html = await withSpan('admin.preview.markdown', () => renderMarkdownPreview(content), { 'preview.length': content.length });
    return NextResponse.json({ html });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to render preview.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
