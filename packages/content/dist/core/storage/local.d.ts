import type { StorageProvider } from './types.js';
export declare class LocalStorageProvider implements StorageProvider {
    private basePath;
    constructor(basePath: string);
    private resolvePath;
    read(filePath: string): Promise<string>;
    write(filePath: string, content: string): Promise<void>;
    delete(filePath: string): Promise<void>;
    exists(filePath: string): Promise<boolean>;
    list(directory: string): Promise<string[]>;
}
