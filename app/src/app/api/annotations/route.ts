import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// Annotation API routes - stub implementation (awaiting Prisma model)

// GET /api/annotations - List annotations for a draft
export async function GET() {
  return NextResponse.json({
    annotations: [],
    counts: {
      open: 0,
      resolved: 0,
      archived: 0,
      total: 0,
    },
  });
}

// POST /api/annotations - Create a new annotation
export async function POST() {
  return NextResponse.json(
    { error: 'Annotation creation not yet implemented' },
    { status: 501 }
  );
}
