import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// Annotation API routes - stub implementation (awaiting Prisma model)

// GET /api/annotations/[id] - Get a single annotation with replies
export async function GET() {
  return NextResponse.json(
    { error: 'Annotation retrieval not yet implemented' },
    { status: 501 }
  );
}

// PATCH /api/annotations/[id] - Update an annotation
export async function PATCH() {
  return NextResponse.json(
    { error: 'Annotation update not yet implemented' },
    { status: 501 }
  );
}

// DELETE /api/annotations/[id] - Delete an annotation and its replies
export async function DELETE() {
  return NextResponse.json(
    { error: 'Annotation deletion not yet implemented' },
    { status: 501 }
  );
}
