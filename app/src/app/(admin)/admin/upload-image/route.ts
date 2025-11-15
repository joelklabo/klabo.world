import { NextResponse } from 'next/server';
import { requireAdminSession } from '@/lib/adminSession';
import { handleImageUpload } from '@/lib/uploads';
import { withSpan } from '@/lib/telemetry';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 60;

export async function POST(request: Request) {
  await requireAdminSession();
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
    return NextResponse.json({ url: result.url, filename: result.filename, storage: result.storage });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Upload failed';
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
