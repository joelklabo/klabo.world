import { promises as fs } from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '..', '..', '..');
const LEGACY_ROOT = path.join(REPO_ROOT, 'Resources');
const DEST_POSTS = path.join(REPO_ROOT, 'content/posts');
const DEST_APPS = path.join(REPO_ROOT, 'content/apps');
async function ensureDirs() {
    await Promise.all([DEST_POSTS, DEST_APPS].map((dir) => fs.mkdir(dir, { recursive: true })));
}
async function directoryExists(dir) {
    try {
        await fs.access(dir);
        return true;
    }
    catch {
        return false;
    }
}
function isIgnorable(name) {
    return name.endsWith('.bak') || name.startsWith('.');
}
const REQUIRED_POST_FIELDS = ['title', 'summary', 'date', 'publishDate'];
function parseFrontMatter(content) {
    const match = content.match(/^-{3,}\s*[\r\n]+([\s\S]*?)\r?\n-{3,}/);
    if (!match) {
        return {};
    }
    const block = match[1];
    return block.split(/\r?\n/).reduce((acc, line) => {
        const trimmed = line.trim();
        if (!trimmed || trimmed.startsWith('#')) {
            return acc;
        }
        const delimiter = trimmed.indexOf(':');
        if (delimiter === -1) {
            return acc;
        }
        const key = trimmed.slice(0, delimiter).trim();
        const value = trimmed.slice(delimiter + 1).trim();
        if (key.length > 0) {
            acc[key] = value;
        }
        return acc;
    }, {});
}
async function ensureFrontMatter(content, filePath, requiredKeys) {
    const data = parseFrontMatter(content);
    const missing = requiredKeys.filter((key) => data[key] === undefined);
    if (missing.length > 0) {
        throw new Error(`[export-legacy] ${filePath} is missing required front matter fields: ${missing.join(', ')}`);
    }
}
async function copyMarkdownFiles(srcDir, destDir, requiredKeys) {
    const exists = await directoryExists(srcDir);
    if (!exists) {
        console.warn(`[export-legacy] skipping missing directory ${srcDir}`);
        return;
    }
    const entries = await fs.readdir(srcDir, { withFileTypes: true });
    await Promise.all(entries
        .filter((entry) => entry.isFile() && !isIgnorable(entry.name))
        .map(async (entry) => {
        const ext = path.extname(entry.name).toLowerCase();
        if (!['.md', '.mdx'].includes(ext)) {
            return;
        }
        const srcPath = path.join(srcDir, entry.name);
        const baseName = path.basename(entry.name, ext);
        const destPath = path.join(destDir, `${baseName}.mdx`);
        const rawContent = await fs.readFile(srcPath, 'utf8');
        const content = rawContent.replace(/\u0000/g, '');
        await ensureFrontMatter(content, entry.name, requiredKeys);
        await fs.writeFile(destPath, content, 'utf8');
        console.info(`[export-legacy] wrote ${destPath}`);
    }));
}
async function copyRawFiles(srcDir, destDir, allowedExts) {
    const exists = await directoryExists(srcDir);
    if (!exists) {
        console.warn(`[export-legacy] skipping missing directory ${srcDir}`);
        return;
    }
    const entries = await fs.readdir(srcDir, { withFileTypes: true });
    await Promise.all(entries
        .filter((entry) => entry.isFile() && !isIgnorable(entry.name))
        .map(async (entry) => {
        const ext = path.extname(entry.name).toLowerCase();
        if (!allowedExts.includes(ext)) {
            return;
        }
        const srcPath = path.join(srcDir, entry.name);
        const destPath = path.join(destDir, entry.name);
        await fs.copyFile(srcPath, destPath);
        console.info(`[export-legacy] copied ${destPath}`);
    }));
}
export async function exportLegacyContent() {
    const hasLegacy = await directoryExists(LEGACY_ROOT);
    if (!hasLegacy) {
        console.warn('[export-legacy] No Resources directory found – nothing to migrate.');
        return;
    }
    await ensureDirs();
    await copyMarkdownFiles(path.join(LEGACY_ROOT, 'Posts'), DEST_POSTS, REQUIRED_POST_FIELDS);
    await copyRawFiles(path.join(LEGACY_ROOT, 'Apps'), DEST_APPS, ['.json']);
}
const invokedDirectly = (() => {
    if (process.argv[1]) {
        const entryUrl = pathToFileURL(process.argv[1]).href;
        return import.meta.url === entryUrl;
    }
    return false;
})();
if (invokedDirectly) {
    exportLegacyContent().catch((err) => {
        console.error('[export-legacy] failed', err);
        process.exitCode = 1;
    });
}
