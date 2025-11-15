"use client";

/* eslint-disable react-hooks/static-components */

import { useMDXComponent } from 'next-contentlayer/hooks';
import { components } from './mdx-components';

export function MDXContent({ code }: { code: string }) {
  const Component = useMDXComponent(code);
  return <Component components={components} />;
}
