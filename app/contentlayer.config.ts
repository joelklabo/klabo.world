import {
  defineDocumentType,
  makeSource,
  type ComputedFields,
} from 'contentlayer/source-files';

const computedFields: ComputedFields = {
  slug: {
    type: 'string',
    resolve: (doc: { _raw: { flattenedPath: string } }) => doc._raw.flattenedPath.replace(/^.+\//, ''),
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
    featuredImage: { type: 'string', required: false },
  },
  computedFields,
}));

export const AppDoc = defineDocumentType(() => ({
  name: 'AppDoc',
  filePathPattern: `apps/**/*.mdx`,
  contentType: 'mdx',
  fields: {
    name: { type: 'string', required: true },
    summary: { type: 'string', required: true },
    publishDate: { type: 'date', required: true },
    icon: { type: 'string', required: false },
    storeUrl: { type: 'string', required: false },
    githubUrl: { type: 'string', required: false },
  },
  computedFields,
}));

export const ContextDoc = defineDocumentType(() => ({
  name: 'ContextDoc',
  filePathPattern: `contexts/**/*.mdx`,
  contentType: 'mdx',
  fields: {
    title: { type: 'string', required: true },
    summary: { type: 'string', required: true },
    createdDate: { type: 'date', required: true },
    updatedDate: { type: 'date', required: false },
    tags: { type: 'list', of: { type: 'string' }, required: false },
    isPublished: { type: 'boolean', required: true, default: true },
  },
  computedFields,
}));

export default makeSource({
  contentDirPath: '../content',
  contentDirExclude: ['README.md'],
  documentTypes: [Post, AppDoc, ContextDoc],
  disableImportAliasWarning: true,
});
