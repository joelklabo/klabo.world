import { annotationInputSchema, annotationUpdateSchema, AnnotationStatus, } from './types.js';
// Convert database record to API type
function toAnnotationMetadata(record) {
    return {
        id: record.id,
        draftSlug: record.draftSlug,
        type: record.type,
        status: record.status,
        content: record.content,
        selectors: JSON.parse(record.selectors),
        color: record.color,
        pinNumber: record.pinNumber,
        parentId: record.parentId,
        depth: record.depth,
        createdAt: record.createdAt,
        updatedAt: record.updatedAt,
        resolvedAt: record.resolvedAt,
        authorId: record.authorId,
    };
}
// Create a new annotation
export async function createAnnotation(input, db, authorId) {
    // Validate input
    const validated = annotationInputSchema.parse(input);
    // Get next pin number for this draft
    const maxPin = await db.aggregate({
        where: { draftSlug: validated.draftSlug },
        _max: { pinNumber: true },
    });
    const nextPinNumber = (maxPin._max.pinNumber ?? 0) + 1;
    // Calculate depth if this is a reply
    let depth = 0;
    if (validated.parentId) {
        const parent = await db.findUnique({ where: { id: validated.parentId } });
        if (!parent) {
            throw new Error(`Parent annotation not found: ${validated.parentId}`);
        }
        depth = parent.depth + 1;
    }
    const record = await db.create({
        data: {
            draftSlug: validated.draftSlug,
            type: validated.type,
            content: validated.content,
            selectors: JSON.stringify(validated.selectors),
            color: validated.color ?? '#3b82f6',
            pinNumber: validated.parentId ? null : nextPinNumber, // Only root annotations get pin numbers
            parentId: validated.parentId ?? null,
            depth,
            authorId: authorId ?? null,
        },
    });
    return {
        id: record.id,
        pinNumber: record.pinNumber ?? nextPinNumber,
        draftSlug: record.draftSlug,
    };
}
// List annotations for a draft
export async function listAnnotations(draftSlug, db, options) {
    // Get root annotations (no parentId)
    const where = {
        draftSlug,
        parentId: null,
    };
    if (options?.status) {
        where.status = options.status;
    }
    const records = await db.findMany({
        where,
        orderBy: { createdAt: 'asc' },
    });
    const annotations = records.map(toAnnotationMetadata);
    // Get counts
    const [open, resolved, archived] = await Promise.all([
        db.count({ where: { draftSlug, status: AnnotationStatus.OPEN } }),
        db.count({ where: { draftSlug, status: AnnotationStatus.RESOLVED } }),
        db.count({ where: { draftSlug, status: AnnotationStatus.ARCHIVED } }),
    ]);
    return {
        annotations,
        counts: {
            open,
            resolved,
            archived,
            total: open + resolved + archived,
        },
    };
}
// Get a single annotation with replies
export async function getAnnotation(id, db) {
    const record = await db.findUnique({
        where: { id },
        include: { replies: true },
    });
    if (!record) {
        return null;
    }
    return {
        ...toAnnotationMetadata(record),
        replies: (record.replies ?? []).map(toAnnotationMetadata),
    };
}
// Update an annotation
export async function updateAnnotation(id, input, db) {
    const validated = annotationUpdateSchema.parse(input);
    const record = await db.update({
        where: { id },
        data: {
            ...(validated.content !== undefined && { content: validated.content }),
            ...(validated.status !== undefined && { status: validated.status }),
            ...(validated.color !== undefined && { color: validated.color }),
        },
    });
    return {
        id: record.id,
        status: record.status,
    };
}
// Resolve an annotation and all its replies
export async function resolveAnnotation(id, db) {
    const resolvedAt = new Date();
    // Resolve the annotation
    await db.update({
        where: { id },
        data: {
            status: AnnotationStatus.RESOLVED,
            resolvedAt,
        },
    });
    // Resolve all replies
    const { count } = await db.updateMany({
        where: { parentId: id },
        data: {
            status: AnnotationStatus.RESOLVED,
            resolvedAt,
        },
    });
    return {
        id,
        resolvedAt,
        repliesResolved: count,
    };
}
// Delete an annotation and all its replies
export async function deleteAnnotation(id, db) {
    // Delete all replies first (cascade should handle this but being explicit)
    const { count } = await db.deleteMany({
        where: { parentId: id },
    });
    // Delete the annotation
    await db.delete({ where: { id } });
    return {
        id,
        deleted: true,
        repliesDeleted: count,
    };
}
// Archive orphaned annotations (when content changes and selector can't anchor)
export async function archiveOrphanedAnnotations(draftSlug, orphanedIds, db) {
    let archived = 0;
    for (const id of orphanedIds) {
        await db.update({
            where: { id },
            data: { status: AnnotationStatus.ARCHIVED },
        });
        archived++;
    }
    return { archived };
}
