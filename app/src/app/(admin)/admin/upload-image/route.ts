import { NextResponse } from 'next/server';
import { consumeRateLimit } from '@/lib/rateLimiter';
import { handleImageUpload } from '@/lib/uploads';
import { runAdminRoute, AdminRouteError } from '@/lib/adminRouteHelpers';
import { withSpan } from '@/lib/telemetry';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(request: Request) {
  return runAdminRoute(async (session) => {
    const rateLimit = await consumeRateLimit({
      request,
      sessionKey: session.user?.email,
      scope: 'admin-upload',
    });
    if (!rateLimit.allowed) {
      throw new AdminRouteError(
        'Too many uploads. Please try again later.',
        429,
        { error: 'Too many uploads. Please try again later.', retryAfter: rateLimit.retryAfterSeconds },
        { 'Retry-After': String(rateLimit.retryAfterSeconds) },
      );
    }

    const formData = await request.formData();
    const file = formData.get('file');
    if (!(file instanceof File)) {
      throw new AdminRouteError('File is required.', 400);
    }

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
  }, 400);
}
