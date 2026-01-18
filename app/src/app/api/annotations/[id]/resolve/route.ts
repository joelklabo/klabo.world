import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

// Annotation resolve API route - stub implementation (awaiting Prisma model)

// POST /api/annotations/[id]/resolve - Resolve an annotation and all replies
export async function POST() {
  return NextResponse.json(
    { error: 'Annotation resolution not yet implemented' },
    { status: 501 }
  );
}
