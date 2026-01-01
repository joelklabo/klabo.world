import { NextResponse } from 'next/server';
import { requireAdminSession } from '@/lib/adminSession';
import { consumeRateLimit } from '@/lib/rateLimiter';
import { handleImageUpload } from '@/lib/uploads';
import { withSpan } from '@/lib/telemetry';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(request: Request) {
  const session = await requireAdminSession();
  const rateLimit = await consumeRateLimit({
    request,
    sessionKey: session.user?.email,
    scope: 'admin-upload',
  });
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: 'Too many uploads. Please try again later.', retryAfter: rateLimit.retryAfterSeconds },
      { status: 429, headers: { 'Retry-After': String(rateLimit.retryAfterSeconds) } },
    );
  }
  const formData = await request.formData();
  const file = formData.get('file');
  if (!(file instanceof File)) {
    return NextResponse.json({ error: 'File is required.' }, { status: 400 });
  }

  try {
    const result = await withSpan('admin.upload.image', async (span) => {
      span.setAttributes({ 'upload.size': file.size, 'upload.type': file.type });
      return handleImageUpload(file);
    });
    return NextResponse.json({
      url: result.url,
      filename: result.filename,
      storage: result.storage,
      status: result.status,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Upload failed';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
