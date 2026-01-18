import { type AnnotationInput, type AnnotationUpdate, type Annotation, type CreateAnnotationResult, type UpdateAnnotationResult, type ResolveAnnotationResult, type DeleteAnnotationResult, type ListAnnotationsResult, AnnotationStatus } from './types.js';
export interface AnnotationDbAdapter {
    findMany(args: {
        where: {
            draftSlug?: string;
            status?: string;
            parentId?: string | null;
        };
        orderBy?: {
            createdAt: 'asc' | 'desc';
        };
        include?: {
            replies?: boolean;
        };
    }): Promise<AnnotationDbRecord[]>;
    findUnique(args: {
        where: {
            id: string;
        };
        include?: {
            replies?: boolean;
        };
    }): Promise<(AnnotationDbRecord & {
        replies?: AnnotationDbRecord[];
    }) | null>;
    create(args: {
        data: AnnotationDbCreateInput;
    }): Promise<AnnotationDbRecord>;
    update(args: {
        where: {
            id: string;
        };
        data: Partial<AnnotationDbCreateInput>;
    }): Promise<AnnotationDbRecord>;
    updateMany(args: {
        where: {
            parentId: string;
        };
        data: Partial<AnnotationDbCreateInput>;
    }): Promise<{
        count: number;
    }>;
    delete(args: {
        where: {
            id: string;
        };
    }): Promise<AnnotationDbRecord>;
    deleteMany(args: {
        where: {
            parentId: string;
        };
    }): Promise<{
        count: number;
    }>;
    count(args: {
        where: {
            draftSlug: string;
            status?: string;
        };
    }): Promise<number>;
    aggregate(args: {
        where: {
            draftSlug: string;
        };
        _max: {
            pinNumber: true;
        };
    }): Promise<{
        _max: {
            pinNumber: number | null;
        };
    }>;
}
export interface AnnotationDbRecord {
    id: string;
    draftSlug: string;
    type: string;
    status: string;
    content: string;
    selectors: string;
    color: string | null;
    pinNumber: number | null;
    parentId: string | null;
    depth: number;
    createdAt: Date;
    updatedAt: Date;
    resolvedAt: Date | null;
    authorId: string | null;
}
export interface AnnotationDbCreateInput {
    id?: string;
    draftSlug: string;
    type: string;
    status?: string;
    content: string;
    selectors: string;
    color?: string | null;
    pinNumber?: number | null;
    parentId?: string | null;
    depth?: number;
    resolvedAt?: Date | null;
    authorId?: string | null;
}
export declare function createAnnotation(input: AnnotationInput, db: AnnotationDbAdapter, authorId?: string): Promise<CreateAnnotationResult>;
export declare function listAnnotations(draftSlug: string, db: AnnotationDbAdapter, options?: {
    status?: AnnotationStatus;
}): Promise<ListAnnotationsResult>;
export declare function getAnnotation(id: string, db: AnnotationDbAdapter): Promise<Annotation | null>;
export declare function updateAnnotation(id: string, input: AnnotationUpdate, db: AnnotationDbAdapter): Promise<UpdateAnnotationResult>;
export declare function resolveAnnotation(id: string, db: AnnotationDbAdapter): Promise<ResolveAnnotationResult>;
export declare function deleteAnnotation(id: string, db: AnnotationDbAdapter): Promise<DeleteAnnotationResult>;
export declare function archiveOrphanedAnnotations(draftSlug: string, orphanedIds: string[], db: AnnotationDbAdapter): Promise<{
    archived: number;
}>;
