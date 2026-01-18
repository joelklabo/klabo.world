import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/nextAuth';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

const updateAnnotationSchema = z.object({
  content: z.string().min(1).optional(),
  status: z.enum(['OPEN', 'RESOLVED', 'ARCHIVED']).optional(),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
});

type RouteContext = { params: Promise<{ id: string }> };

// GET /api/annotations/[id] - Get a single annotation with replies
export async function GET(request: Request, context: RouteContext) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await context.params;

  const annotation = await prisma.annotation.findUnique({
    where: { id },
    include: {
      replies: {
        orderBy: { createdAt: 'asc' },
      },
    },
  });

  if (!annotation) {
    return NextResponse.json({ error: 'Annotation not found' }, { status: 404 });
  }

  return NextResponse.json({
    ...annotation,
    selectors: JSON.parse(annotation.selectors),
    replies: annotation.replies.map((r) => ({
      ...r,
      selectors: JSON.parse(r.selectors),
    })),
  });
}

// PATCH /api/annotations/[id] - Update an annotation
export async function PATCH(request: Request, context: RouteContext) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await context.params;
  const body = await request.json();
  const parsed = updateAnnotationSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { content, status, color } = parsed.data;

  const data: { content?: string; status?: string; color?: string; resolvedAt?: Date | null } = {};
  if (content !== undefined) data.content = content;
  if (status !== undefined) {
    data.status = status;
    if (status === 'RESOLVED') {
      data.resolvedAt = new Date();
    } else if (status === 'OPEN') {
      data.resolvedAt = null;
    }
  }
  if (color !== undefined) data.color = color;

  const annotation = await prisma.annotation.update({
    where: { id },
    data,
  });

  return NextResponse.json({
    ...annotation,
    selectors: JSON.parse(annotation.selectors),
  });
}

// DELETE /api/annotations/[id] - Delete an annotation and its replies
export async function DELETE(request: Request, context: RouteContext) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await context.params;

  // Delete replies first (cascade should handle this but being explicit)
  const { count: repliesDeleted } = await prisma.annotation.deleteMany({
    where: { parentId: id },
  });

  // Delete the annotation
  await prisma.annotation.delete({
    where: { id },
  });

  return NextResponse.json({
    id,
    deleted: true,
    repliesDeleted,
  });
}
