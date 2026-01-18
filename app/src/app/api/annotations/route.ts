import { NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { auth } from '@/lib/nextAuth';
import { z } from 'zod';

export const dynamic = 'force-dynamic';

// Selector schemas
const textQuoteSelectorSchema = z.object({
  type: z.literal('TextQuoteSelector'),
  exact: z.string(),
  prefix: z.string().optional(),
  suffix: z.string().optional(),
});

const textPositionSelectorSchema = z.object({
  type: z.literal('TextPositionSelector'),
  start: z.number(),
  end: z.number(),
});

const xpathSelectorSchema = z.object({
  type: z.literal('XPathSelector'),
  value: z.string(),
  offset: z.number().optional(),
});

const rectangleSelectorSchema = z.object({
  type: z.literal('RectangleSelector'),
  x: z.number(),
  y: z.number(),
  width: z.number(),
  height: z.number(),
  pageWidth: z.number(),
  pageHeight: z.number(),
});

const pointSelectorSchema = z.object({
  type: z.literal('PointSelector'),
  x: z.number(),
  y: z.number(),
  pageWidth: z.number(),
  pageHeight: z.number(),
});

const selectorSchema = z.discriminatedUnion('type', [
  textQuoteSelectorSchema,
  textPositionSelectorSchema,
  xpathSelectorSchema,
  rectangleSelectorSchema,
  pointSelectorSchema,
]);

const createAnnotationSchema = z.object({
  draftSlug: z.string().min(1),
  type: z.enum(['TEXT_HIGHLIGHT', 'RECTANGLE', 'POINT']),
  content: z.string().min(1),
  selectors: z.array(selectorSchema).min(1),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/).optional(),
  parentId: z.string().optional(),
});

// GET /api/annotations - List annotations for a draft
export async function GET(request: Request) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const draftSlug = searchParams.get('draftSlug');
  const status = searchParams.get('status');

  if (!draftSlug) {
    return NextResponse.json({ error: 'draftSlug is required' }, { status: 400 });
  }

  // Get root annotations only
  const where: { draftSlug: string; status?: string; parentId: null } = {
    draftSlug,
    parentId: null,
  };
  if (status && ['OPEN', 'RESOLVED', 'ARCHIVED'].includes(status)) {
    where.status = status;
  }

  const annotations = await prisma.annotation.findMany({
    where,
    orderBy: { createdAt: 'asc' },
    include: {
      replies: {
        orderBy: { createdAt: 'asc' },
      },
    },
  });

  // Get counts
  const [open, resolved, archived] = await Promise.all([
    prisma.annotation.count({ where: { draftSlug, status: 'OPEN' } }),
    prisma.annotation.count({ where: { draftSlug, status: 'RESOLVED' } }),
    prisma.annotation.count({ where: { draftSlug, status: 'ARCHIVED' } }),
  ]);

  // Parse selectors JSON
  const parsed = annotations.map((a) => ({
    ...a,
    selectors: JSON.parse(a.selectors),
    replies: a.replies.map((r) => ({
      ...r,
      selectors: JSON.parse(r.selectors),
    })),
  }));

  return NextResponse.json({
    annotations: parsed,
    counts: {
      open,
      resolved,
      archived,
      total: open + resolved + archived,
    },
  });
}

// POST /api/annotations - Create a new annotation
export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.email) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const parsed = createAnnotationSchema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 });
  }

  const { draftSlug, type, content, selectors, color, parentId } = parsed.data;

  // Get admin ID
  const admin = await prisma.admin.findUnique({
    where: { email: session.user.email },
    select: { id: true },
  });

  // Calculate next pin number for root annotations
  let pinNumber: number | null = null;
  let depth = 0;

  if (parentId) {
    // Get parent to calculate depth
    const parent = await prisma.annotation.findUnique({
      where: { id: parentId },
    });
    if (!parent) {
      return NextResponse.json({ error: 'Parent annotation not found' }, { status: 404 });
    }
    depth = parent.depth + 1;
  } else {
    // Get next pin number
    const maxPin = await prisma.annotation.aggregate({
      where: { draftSlug },
      _max: { pinNumber: true },
    });
    pinNumber = (maxPin._max.pinNumber ?? 0) + 1;
  }

  const annotation = await prisma.annotation.create({
    data: {
      draftSlug,
      type,
      content,
      selectors: JSON.stringify(selectors),
      color: color ?? '#3b82f6',
      pinNumber,
      parentId: parentId ?? null,
      depth,
      authorId: admin?.id ?? null,
    },
  });

  return NextResponse.json({
    ...annotation,
    selectors: JSON.parse(annotation.selectors),
  });
}
