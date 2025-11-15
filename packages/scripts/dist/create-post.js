import { promises as fs } from 'node:fs';
import path from 'node:path';
import slugify from 'slugify';
const POSTS_DIR = path.resolve('content/posts');
function parseArgs(argv) {
    const args = {};
    for (let i = 0; i < argv.length; i += 1) {
        const arg = argv[i];
        if (arg.startsWith('--')) {
            const key = arg.slice(2);
            const value = argv[i + 1];
            if (!value || value.startsWith('--')) {
                throw new Error(`Missing value for --${key}`);
            }
            args[key] = value;
            i += 1;
        }
    }
    if (!args.title) {
        throw new Error('Missing required --title argument');
    }
    return {
        title: args.title,
        summary: args.summary,
        tags: args.tags ? args.tags.split(',').map((tag) => tag.trim()).filter(Boolean) : undefined,
        publishDate: args.publishDate,
        featuredImage: args.featuredImage,
    };
}
function toYamlList(values) {
    if (!values || values.length === 0) {
        return undefined;
    }
    return `\n${values.map((value) => `  - ${value}`).join('\n')}`;
}
function buildTemplate(slug, options) {
    const today = new Date().toISOString().slice(0, 10);
    const lines = ['---'];
    lines.push(`title: ${JSON.stringify(options.title)}`);
    lines.push(`summary: ${JSON.stringify(options.summary ?? 'Draft summary')}`);
    lines.push(`date: ${today}`);
    lines.push(`publishDate: ${options.publishDate ?? today}`);
    const tags = toYamlList(options.tags);
    if (tags) {
        lines.push(`tags:${tags}`);
    }
    else {
        lines.push('tags: []');
    }
    if (options.featuredImage) {
        lines.push(`featuredImage: ${JSON.stringify(options.featuredImage)}`);
    }
    lines.push('---', '', `# ${options.title}`, '', 'Start writing your post here...');
    return lines.join('\n');
}
async function ensureDir(dir) {
    await fs.mkdir(dir, { recursive: true });
}
async function slugExists(slug) {
    try {
        await fs.access(path.join(POSTS_DIR, `${slug}.mdx`));
        return true;
    }
    catch {
        return false;
    }
}
async function resolveSlug(base) {
    let candidate = base;
    let counter = 1;
    while (await slugExists(candidate)) {
        candidate = `${base}-${counter}`;
        counter += 1;
    }
    return candidate;
}
async function writePost(options) {
    await ensureDir(POSTS_DIR);
    const baseSlug = slugify(options.title, { lower: true, strict: true });
    const slug = await resolveSlug(baseSlug);
    const content = buildTemplate(slug, options);
    const filePath = path.join(POSTS_DIR, `${slug}.mdx`);
    await fs.writeFile(filePath, content, 'utf8');
    return { slug, filePath };
}
async function main() {
    const options = parseArgs(process.argv.slice(2));
    const { slug, filePath } = await writePost(options);
    console.log(`✅ Created content/posts/${slug}.mdx`);
    console.log(`   Path: ${filePath}`);
    console.log('Next steps:');
    console.log(' - Fill in the summary, tags, and Markdown body');
    console.log(' - Add featuredImage or publishDate as needed');
}
main().catch((err) => {
    console.error('[scripts/create-post] failed:', err.message);
    process.exitCode = 1;
});
