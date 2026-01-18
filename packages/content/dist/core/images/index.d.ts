import type { ImageUploadInput, ImageUploadResult } from '../drafts/types.js';
export type ImageConfig = {
    uploadsDir: string;
    baseUrl: string;
};
export declare function buildImageMarkdown(url: string, altText?: string): string;
export declare function uploadImage(input: ImageUploadInput, config: ImageConfig): Promise<ImageUploadResult>;
export declare function uploadImageFromPath(filePath: string, config: ImageConfig, altText?: string): Promise<ImageUploadResult>;
export declare function listImages(config: ImageConfig): Promise<string[]>;
export declare function deleteImage(filename: string, config: ImageConfig): Promise<boolean>;
