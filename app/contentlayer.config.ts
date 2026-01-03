import {
  defineDocumentType,
  makeSource,
  type ComputedFields,
} from 'contentlayer/source-files';
import path from 'node:path';

const cwd = process.cwd();
const repoRoot = path.basename(cwd) === 'app' ? path.resolve(cwd, '..') : cwd;
const contentRoot = path.join(repoRoot, 'content');

const computedFields: ComputedFields = {
  slug: {
    type: 'string',
    resolve: (doc) => doc._raw.flattenedPath.replace(/^.+\//, ''),
  },
  url: {
    type: 'string',
    resolve: (doc) => {
      if (doc._raw.flattenedPath.startsWith('posts/')) {
        return `/posts/${doc._raw.flattenedPath.replace(/^posts\//, '')}`;
      }
      if (doc._raw.flattenedPath.startsWith('apps/')) {
        return `/apps/${doc._raw.flattenedPath.replace(/^apps\//, '')}`;
      }
      if (doc._raw.flattenedPath.startsWith('dashboards/')) {
        return `/admin/dashboards/${doc._raw.flattenedPath.replace(/^dashboards\//, '')}`;
      }
      return `/${doc._raw.flattenedPath}`;
    },
  },
};

export const Post = defineDocumentType(() => ({
  name: 'Post',
  filePathPattern: `posts/**/*.mdx`,
  contentType: 'mdx',
  fields: {
    title: { type: 'string', required: true },
    summary: { type: 'string', required: true },
    date: { type: 'date', required: true },
    publishDate: { type: 'date', required: false },
    tags: { type: 'list', of: { type: 'string' }, required: false },
    aliases: { type: 'list', of: { type: 'string' }, required: false, default: [] },
    featuredImage: { type: 'string', required: false },
    lightningAddress: { type: 'string', required: false },
    nostrPubkey: { type: 'string', required: false },
    nostrRelays: { type: 'list', of: { type: 'string' }, required: false },
    nostrstackEnabled: { type: 'boolean', required: false, default: true },
  },
  computedFields,
}));

export const AppDoc = defineDocumentType(() => ({
  name: 'AppDoc',
  filePathPattern: `apps/**/*.json`,
  contentType: 'data',
  fields: {
    name: { type: 'string', required: true },
    slug: { type: 'string', required: true },
    version: { type: 'string', required: true },
    publishDate: { type: 'date', required: true },
    icon: { type: 'string', required: false },
    screenshots: { type: 'list', of: { type: 'string' }, required: false },
    features: { type: 'list', of: { type: 'string' }, required: false },
    fullDescription: { type: 'string', required: true },
    appStoreURL: { type: 'string', required: false },
    githubURL: { type: 'string', required: false },
  },
  computedFields,
}));

export const DashboardDoc = defineDocumentType(() => ({
  name: 'DashboardDoc',
  filePathPattern: `dashboards/**/*.mdx`,
  contentType: 'mdx',
  fields: {
    title: { type: 'string', required: true },
    summary: { type: 'string', required: true },
    panelType: { type: 'string', required: true, default: 'chart' },
    tags: { type: 'list', of: { type: 'string' }, required: false },
    chartType: { type: 'string', required: false },
    kqlQuery: { type: 'string', required: false },
    iframeUrl: { type: 'string', required: false },
    externalUrl: { type: 'string', required: false },
    refreshIntervalSeconds: { type: 'number', required: false },
  },
  computedFields,
}));

export default makeSource({
  contentDirPath: contentRoot,
  contentDirExclude: ['README.md'],
  documentTypes: [Post, AppDoc, DashboardDoc],
  disableImportAliasWarning: true,
  mdx: {
    mdxOptions: (opts) => {
      // Force production MDX output to avoid React 19 dev runtime issues in RSC.
      opts.development = false;
      return opts;
    },
  },
});
