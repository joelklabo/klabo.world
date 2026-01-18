import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/nextAuth';

export const dynamic = 'force-dynamic';

type RouteContext = { params: Promise<{ id: string }> };

// POST /api/annotations/[id]/resolve - Resolve an annotation and all replies
export async function POST(request: Request, context: RouteContext) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { id } = await context.params;
  const resolvedAt = new Date();

  // Resolve the annotation
  const annotation = await prisma.annotation.update({
    where: { id },
    data: {
      status: 'RESOLVED',
      resolvedAt,
    },
  });

  // Resolve all replies
  const { count: repliesResolved } = await prisma.annotation.updateMany({
    where: { parentId: id },
    data: {
      status: 'RESOLVED',
      resolvedAt,
    },
  });

  return NextResponse.json({
    id: annotation.id,
    resolvedAt,
    repliesResolved,
  });
}
