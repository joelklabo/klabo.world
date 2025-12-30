/* eslint-disable react-hooks/static-components */

import { cache } from 'react';
import { getMDXComponent } from 'next-contentlayer/hooks';
import * as jsxRuntime from 'react/jsx-runtime';
import * as jsxDevRuntime from 'react/jsx-dev-runtime';
import { components } from './mdx-components';

const getMDXComponentCached = cache((code: string, useDevRuntime: boolean) =>
  getMDXComponent(code, { _jsx_runtime: useDevRuntime ? jsxDevRuntime : jsxRuntime }),
);

export function MDXContent({ code }: { code: string }) {
  const Component = getMDXComponentCached(code, code.includes('jsxDEV'));
  return <Component components={components} />;
}
