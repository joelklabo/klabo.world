/* eslint-disable react-hooks/static-components */

import { cache } from 'react';
import { getMDXComponent } from 'next-contentlayer/hooks';
import * as jsxRuntime from 'react/jsx-runtime';
import * as jsxDevRuntime from 'react/jsx-dev-runtime';
import { createMdxComponents } from './mdx-components';

const getMDXComponentCached = cache((code: string, useDevRuntime: boolean) =>
  getMDXComponent(code, { _jsx_runtime: useDevRuntime ? jsxDevRuntime : jsxRuntime }),
);

export function MDXContent({ code }: { code: string }) {
  const Component = getMDXComponentCached(code, code.includes('jsxDEV'));
  const imageState = { used: false };
  const markFirstImage = () => {
    if (imageState.used) return false;
    imageState.used = true;
    return true;
  };
  return <Component components={createMdxComponents({ markFirstImage })} />;
}
