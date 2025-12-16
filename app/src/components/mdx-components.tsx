"use client";

import { ClipboardDocumentIcon, ClipboardDocumentCheckIcon } from '@heroicons/react/24/outline';
import Highlight, { defaultProps, type Language, type PrismTheme } from 'prism-react-renderer';
import Image from 'next/image';
import Link from 'next/link';
import type { Route } from 'next';
import React, { useState, type ReactNode } from 'react';

const warmPrismTheme: PrismTheme = {
  plain: {
    color: '#E8EDF6',
    backgroundColor: '#0f172a',
  },
  styles: [
    { types: ['comment', 'prolog', 'doctype', 'cdata'], style: { color: '#8BA0BE' } },
    { types: ['punctuation'], style: { color: '#8BA0BE' } },
    { types: ['property', 'tag', 'boolean', 'number', 'constant', 'symbol'], style: { color: '#F4B563' } },
    { types: ['attr-name', 'string', 'char', 'builtin', 'inserted'], style: { color: '#F28CA6' } },
    { types: ['operator', 'entity', 'url', 'variable'], style: { color: '#A6E3FF' } },
    { types: ['keyword'], style: { color: '#F4B563', fontWeight: '700' } },
    { types: ['function', 'class-name'], style: { color: '#7AD7F0' } },
    { types: ['deleted'], style: { color: '#F16B6B' } },
    { types: ['italic'], style: { fontStyle: 'italic' } },
    { types: ['bold'], style: { fontWeight: '700' } },
  ],
};

const baseCodeStyles =
  'relative mt-4 rounded-2xl border border-[#1e293b] bg-gradient-to-b from-[#0b1223] to-[#0d1428] p-4 shadow-[0_20px_60px_rgba(11,18,35,0.65)] text-sm leading-relaxed';

function CodeBlock({ children }: { children: ReactNode }) {
  const child = Array.isArray(children) ? children[0] : children;
  const code = typeof child === 'string' ? child : (typeof child?.props?.children === 'string' ? child.props.children : '');
  const className = typeof child?.props?.className === 'string' ? child.props.className : '';
  const languageMatch = className.match(/language-(\w+)/);
  const language = (languageMatch?.[1] ?? 'tsx') as Language;
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!code) return;
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      globalThis.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  const trimmedCode = code.trimEnd();

  return (
    <div className={`${baseCodeStyles} relative`}>
      <div className="absolute left-3 top-3 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.35em] text-amber-100/90">
        {language.toUpperCase()}
      </div>
      <button
        type="button"
        onClick={handleCopy}
        className="absolute right-3 top-3 flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.3em] text-slate-100 transition hover:border-amber-200/60 hover:text-amber-100"
      >
        {copied ? (
          <>
            <ClipboardDocumentCheckIcon className="h-3 w-3" />
            Copied
          </>
        ) : (
          <>
            <ClipboardDocumentIcon className="h-3 w-3" />
            Copy
          </>
        )}
      </button>
      <Highlight {...defaultProps} code={trimmedCode} language={language} theme={warmPrismTheme}>
        {({ className, style, tokens, getLineProps, getTokenProps }) => (
          <pre className="mt-10 overflow-x-auto rounded-xl bg-transparent" aria-label={`Code snippet (${language})`}>
            <code className={className} style={{ ...style, paddingTop: '0.5rem' }}>
              {tokens.map((line, lineIndex) => {
                const lineProps = getLineProps({ line, key: lineIndex });
                const { key: _lineKey, ...lineRest } = lineProps;
                return (
                  <div key={`line-${lineIndex}`} {...lineRest} className="flex">
                    {line.map((token, tokenIndex) => {
                      const tokenProps = getTokenProps({ token, key: tokenIndex });
                      const { key: _tokenKey, ...tokenRest } = tokenProps;
                      return <span key={`token-${lineIndex}-${tokenIndex}`} {...tokenRest} />;
                    })}
                  </div>
                );
              })}
            </code>
          </pre>
        )}
      </Highlight>
    </div>
  );
}

function InlineCode(props: { children: ReactNode }) {
  return (
    <code
      className="break-words rounded-md border border-amber-200/30 bg-amber-100/10 px-1.5 py-0.5 font-mono text-[13px] font-semibold leading-6 text-amber-100 shadow-inner shadow-amber-200/10"
      {...props}
    />
  );
}

function Paragraph({ children, ...props }: { children: ReactNode; [key: string]: unknown }) {
  const unwrapFigure = () => {
    if (Array.isArray(children)) {
      const onlyChild = children.find(Boolean);
      if (React.isValidElement(onlyChild) && onlyChild.type === 'figure') {
        return onlyChild;
      }
    } else if (React.isValidElement(children) && children.type === 'figure') {
      return children;
    }
    return null;
  };

  const figure = unwrapFigure();
  if (figure) {
    return figure;
  }

  return <p {...props}>{children}</p>;
}

function ProseImage(props: { src?: string | null; alt?: string; title?: string }) {
  const { src, alt, title } = props;
  if (!src) {
    return null;
  }
  return (
    <figure className="group relative my-10">
      <Link href={src as Route} target="_blank" rel="noreferrer" className="pointer-events-auto">
        <div className="relative overflow-hidden rounded-[32px] border border-white/10 bg-gradient-to-b from-slate-900 via-slate-950 to-black shadow-2xl shadow-black/60 transition hover:-translate-y-1.5 hover:shadow-[0_30px_50px_rgba(2,6,23,0.75)]">
          <Image
            src={src}
            alt={alt ?? 'Illustration'}
            title={title}
            width={1600}
            height={900}
            sizes="(max-width: 768px) 100vw, 800px"
            className="w-full max-h-[70vh] object-contain transition duration-300 group-hover:scale-105 md:max-h-[80vh]"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black/50 opacity-0 transition group-hover:opacity-100" />
        </div>
      </Link>
      {(alt || title) && (
        <figcaption className="mt-3 text-xs uppercase tracking-[0.4em] text-slate-500">
          {alt ?? title}
        </figcaption>
      )}
    </figure>
  );
}

function BlockQuote(props: { children: ReactNode }) {
  return (
    <blockquote className="rounded-2xl border-l-4 border-amber-300/80 bg-amber-100/5 p-5 text-base leading-relaxed text-slate-100 shadow-[0_14px_32px_rgba(15,23,42,0.4)]">
      {props.children}
    </blockquote>
  );
}

const components = {
  pre: ({ children }: { children: ReactNode }) => <CodeBlock>{children}</CodeBlock>,
  code: InlineCode,
  p: Paragraph,
  img: ProseImage,
  blockquote: BlockQuote,
  table: (props: { children: ReactNode }) => (
    <div className="relative overflow-hidden rounded-2xl border border-white/5 bg-slate-900/60 shadow-xl shadow-black/30">
      {/* eslint-disable-next-line sonarjs/table-header */}
      <table className="min-w-full divide-y divide-slate-800 bg-slate-950/60" {...props} />
    </div>
  ),
  thead: (props: { children: ReactNode }) => (
    <thead className="bg-slate-900/80 text-xs uppercase tracking-[0.28em] text-amber-100/80" {...props} />
  ),
  th: (props: { children: ReactNode }) => (
    <th className="border-b border-slate-800 px-4 py-3 text-left text-sm font-semibold text-slate-100" {...props} />
  ),
  td: (props: { children: ReactNode }) => (
    <td className="border-b border-slate-900 px-4 py-3 text-sm text-slate-200" {...props} />
  ),
  ul: (props: { children: ReactNode }) => (
    <ul className="space-y-2 pl-5 text-sm text-slate-200 marker:text-amber-200/80" {...props} />
  ),
  ol: (props: { children: ReactNode }) => (
    <ol className="space-y-2 pl-5 text-sm text-slate-200" {...props} />
  ),
  li: (props: { children: ReactNode }) => <li className="leading-relaxed" {...props} />,
};

export { components };
