"use client";

/* eslint-disable react-hooks/static-components */

import { useMDXComponent } from 'next-contentlayer/hooks';

export function MDXContent({ code }: { code: string }) {
  const Component = useMDXComponent(code);
  return <Component />;
}
