import { promises as fs } from 'node:fs';
import path from 'node:path';

const LEGACY_ROOT = path.resolve('Resources');
const DEST_POSTS = path.resolve('content/posts');
const DEST_APPS = path.resolve('content/apps');
const DEST_CONTEXTS = path.resolve('content/contexts');

async function ensureDirs() {
  await Promise.all([DEST_POSTS, DEST_APPS, DEST_CONTEXTS].map((dir) => fs.mkdir(dir, { recursive: true })));
}

async function directoryExists(dir: string): Promise<boolean> {
  try {
    await fs.access(dir);
    return true;
  } catch {
    return false;
  }
}

async function copyMarkdownFiles(srcDir: string, destDir: string) {
  const exists = await directoryExists(srcDir);
  if (!exists) {
    console.warn(`[export-legacy] skipping missing directory ${srcDir}`);
    return;
  }
  const entries = await fs.readdir(srcDir, { withFileTypes: true });
  await Promise.all(
    entries
      .filter((entry) => entry.isFile())
      .map(async (entry) => {
        const srcPath = path.join(srcDir, entry.name);
        const baseName = entry.name.replace(/\.(md|mdx|json)$/i, '');
        const destPath = path.join(destDir, `${baseName}.mdx`);
        const content = await fs.readFile(srcPath, 'utf8');
        await fs.writeFile(destPath, content, 'utf8');
        console.info(`[export-legacy] wrote ${destPath}`);
      })
  );
}

export async function exportLegacyContent(): Promise<void> {
  const hasLegacy = await directoryExists(LEGACY_ROOT);
  if (!hasLegacy) {
    console.warn('[export-legacy] No Resources directory found – nothing to migrate.');
    return;
  }
  await ensureDirs();
  await copyMarkdownFiles(path.join(LEGACY_ROOT, 'Posts'), DEST_POSTS);
  await copyMarkdownFiles(path.join(LEGACY_ROOT, 'Contexts'), DEST_CONTEXTS);
  await copyMarkdownFiles(path.join(LEGACY_ROOT, 'Apps'), DEST_APPS);
}

if (require.main === module) {
  exportLegacyContent().catch((err) => {
    console.error('[export-legacy] failed', err);
    process.exitCode = 1;
  });
}
