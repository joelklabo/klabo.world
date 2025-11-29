import { compile, run, type CompileOptions } from '@mdx-js/mdx';
import remarkFrontmatter from 'remark-frontmatter';
import remarkGfm from 'remark-gfm';
import * as runtime from 'react/jsx-runtime';

const mdxOptions: CompileOptions = {
  development: false,
  outputFormat: 'function-body',
  remarkPlugins: [remarkFrontmatter, remarkGfm],
};

export async function renderMarkdownPreview(source: string): Promise<string> {
  const compiled = await compile(source, mdxOptions);
  const { default: MDXContent } = await run(compiled, runtime);
  const { renderToStaticMarkup } = await import('react-dom/server');
  const element = MDXContent({});
  return renderToStaticMarkup(element);
}
