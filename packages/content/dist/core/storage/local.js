import * as fs from 'node:fs/promises';
import * as path from 'node:path';
export class LocalStorageProvider {
    basePath;
    constructor(basePath) {
        this.basePath = basePath;
    }
    resolvePath(filePath) {
        // If absolute, use as-is; otherwise resolve from basePath
        if (path.isAbsolute(filePath)) {
            return filePath;
        }
        return path.join(this.basePath, filePath);
    }
    async read(filePath) {
        const fullPath = this.resolvePath(filePath);
        return fs.readFile(fullPath, 'utf-8');
    }
    async write(filePath, content) {
        const fullPath = this.resolvePath(filePath);
        const dir = path.dirname(fullPath);
        // Ensure directory exists
        await fs.mkdir(dir, { recursive: true });
        await fs.writeFile(fullPath, content, 'utf-8');
    }
    async delete(filePath) {
        const fullPath = this.resolvePath(filePath);
        await fs.unlink(fullPath);
    }
    async exists(filePath) {
        const fullPath = this.resolvePath(filePath);
        try {
            await fs.access(fullPath);
            return true;
        }
        catch {
            return false;
        }
    }
    async list(directory) {
        const fullPath = this.resolvePath(directory);
        try {
            const entries = await fs.readdir(fullPath, { withFileTypes: true });
            return entries
                .filter((entry) => entry.isFile() && entry.name.endsWith('.mdx'))
                .map((entry) => entry.name);
        }
        catch {
            return [];
        }
    }
}
