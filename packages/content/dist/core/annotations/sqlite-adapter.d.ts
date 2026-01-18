import type { AnnotationDbAdapter, AnnotationDbRecord, AnnotationDbCreateInput } from './operations.js';
export declare class SqliteAnnotationAdapter implements AnnotationDbAdapter {
    private db;
    constructor(databasePath: string);
    private rowToRecord;
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
    close(): void;
}
export declare function createAnnotationAdapter(databaseUrl?: string): SqliteAnnotationAdapter;
