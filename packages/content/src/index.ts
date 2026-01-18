// Main package exports
export * from './core/index.js';

// Re-export for convenience
export type {
  Draft,
  DraftInput,
  DraftMetadata,
  ApiResponse,
  NextAction,
  ApiError,
  ImageUploadResult,
} from './core/drafts/types.js';

export type { StorageProvider, StorageConfig } from './core/storage/types.js';
