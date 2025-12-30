/* eslint-disable react-hooks/static-components */

import { cache } from 'react';
import { getMDXComponent } from 'next-contentlayer/hooks';
import { components } from './mdx-components';

const getMDXComponentCached = cache((code: string) => getMDXComponent(code));

export function MDXContent({ code }: { code: string }) {
  const Component = getMDXComponentCached(code);
  return <Component components={components} />;
}
