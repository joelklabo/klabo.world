// Storage provider interface for filesystem abstraction
export interface StorageProvider {
  read(path: string): Promise<string>;
  write(path: string, content: string): Promise<void>;
  delete(path: string): Promise<void>;
  exists(path: string): Promise<boolean>;
  list(directory: string): Promise<string[]>;
}

// Storage configuration
export type StorageConfig = {
  type: 'local' | 'github';
  basePath: string;
  // GitHub-specific
  githubToken?: string;
  githubOwner?: string;
  githubRepo?: string;
  githubBranch?: string;
};
