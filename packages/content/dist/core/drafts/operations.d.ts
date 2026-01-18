import type { StorageProvider } from '../storage/types.js';
import { type Draft, type DraftInput, type CreateDraftResult, type UpdateDraftResult, type PublishDraftResult, type ListDraftsResult, type DeleteDraftResult } from './types.js';
export type DraftConfig = {
    contentDir: string;
    baseUrl: string;
};
export declare function generateSlug(title: string): string;
export declare function createDraft(input: DraftInput, storage: StorageProvider, config: DraftConfig): Promise<CreateDraftResult>;
export declare function updateDraft(slug: string, input: Partial<DraftInput>, storage: StorageProvider, config: DraftConfig): Promise<UpdateDraftResult>;
export declare function getDraft(slug: string, storage: StorageProvider, config: DraftConfig): Promise<Draft | null>;
export declare function listDrafts(storage: StorageProvider, config: DraftConfig): Promise<ListDraftsResult>;
export declare function deleteDraft(slug: string, storage: StorageProvider, config: DraftConfig): Promise<DeleteDraftResult>;
export declare function publishDraft(slug: string, storage: StorageProvider, config: DraftConfig, options?: {
    publishDate?: string;
}): Promise<PublishDraftResult>;
export declare function unpublishPost(slug: string, storage: StorageProvider, config: DraftConfig): Promise<UpdateDraftResult>;
