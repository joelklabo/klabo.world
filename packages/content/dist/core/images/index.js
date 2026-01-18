import * as fs from 'node:fs/promises';
import * as path from 'node:path';
// Supported MIME types
const SUPPORTED_TYPES = new Set([
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
]);
// Max file size (10MB)
const MAX_SIZE = 10 * 1024 * 1024;
// Generate a unique filename
function generateFilename(originalName) {
    const ext = path.extname(originalName);
    const base = path.basename(originalName, ext);
    const slug = base
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '-')
        .replace(/-+/g, '-')
        .slice(0, 50);
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).slice(2, 6);
    return `${slug}-${timestamp}${random}${ext}`;
}
// Build markdown image syntax
export function buildImageMarkdown(url, altText) {
    const alt = altText || '';
    return `![${alt}](${url})`;
}
// Upload an image to local storage
export async function uploadImage(input, config) {
    // Validate MIME type
    if (!SUPPORTED_TYPES.has(input.mimeType)) {
        throw new Error(`Unsupported image type: ${input.mimeType}. Supported: ${[...SUPPORTED_TYPES].join(', ')}`);
    }
    // Validate size
    if (input.file.length > MAX_SIZE) {
        throw new Error(`File too large: ${(input.file.length / 1024 / 1024).toFixed(2)}MB. Max: 10MB`);
    }
    // Generate unique filename
    const filename = generateFilename(input.filename);
    const filePath = path.join(config.uploadsDir, filename);
    // Ensure uploads directory exists
    await fs.mkdir(config.uploadsDir, { recursive: true });
    // Write file
    await fs.writeFile(filePath, input.file);
    // Build URL
    const url = `/uploads/${filename}`;
    return {
        filename,
        url,
        markdown: buildImageMarkdown(url, input.altText),
        storage: 'local',
        size: input.file.length,
    };
}
// Upload image from file path
export async function uploadImageFromPath(filePath, config, altText) {
    // Read file
    const file = await fs.readFile(filePath);
    const filename = path.basename(filePath);
    // Determine MIME type from extension
    const ext = path.extname(filename).toLowerCase();
    const mimeTypes = {
        '.jpg': 'image/jpeg',
        '.jpeg': 'image/jpeg',
        '.png': 'image/png',
        '.gif': 'image/gif',
        '.webp': 'image/webp',
    };
    const mimeType = mimeTypes[ext];
    if (!mimeType) {
        throw new Error(`Unsupported image extension: ${ext}`);
    }
    return uploadImage({
        file,
        filename,
        mimeType,
        altText,
    }, config);
}
// List images in uploads directory
export async function listImages(config) {
    try {
        const files = await fs.readdir(config.uploadsDir);
        return files.filter((f) => {
            const ext = path.extname(f).toLowerCase();
            return ['.jpg', '.jpeg', '.png', '.gif', '.webp'].includes(ext);
        });
    }
    catch {
        return [];
    }
}
// Delete an image
export async function deleteImage(filename, config) {
    const filePath = path.join(config.uploadsDir, filename);
    try {
        await fs.unlink(filePath);
        return true;
    }
    catch {
        return false;
    }
}
