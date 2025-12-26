"use client";

import { ClipboardDocumentIcon, ClipboardDocumentCheckIcon } from '@heroicons/react/24/outline';
import Highlight, { defaultProps, type Language, type PrismTheme } from 'prism-react-renderer';
import Image from 'next/image';
import Link from 'next/link';
import type { Route } from 'next';
import React, { useState, type ReactNode } from 'react';

const warmPrismTheme: PrismTheme = {
  plain: {
    color: 'var(--foreground)',
    backgroundColor: 'var(--card)',
  },
  styles: [
    { types: ['comment', 'prolog', 'doctype', 'cdata'], style: { color: 'var(--muted-foreground)' } },
    { types: ['punctuation'], style: { color: 'var(--muted-foreground)' } },
    { types: ['property', 'tag', 'boolean', 'number', 'constant', 'symbol'], style: { color: 'var(--primary)' } },
    { types: ['attr-name', 'string', 'char', 'builtin', 'inserted'], style: { color: 'var(--secondary)' } },
    { types: ['operator', 'entity', 'url', 'variable'], style: { color: 'var(--foreground)' } },
    { types: ['keyword'], style: { color: 'var(--primary)', fontWeight: '700' } },
    { types: ['function', 'class-name'], style: { color: 'var(--secondary)' } },
    { types: ['deleted'], style: { color: 'var(--destructive)' } },
    { types: ['italic'], style: { fontStyle: 'italic' } },
    { types: ['bold'], style: { fontWeight: '700' } },
  ],
};

const baseCodeStyles =
  'relative mt-4 rounded-2xl border border-border/60 bg-card/80 p-4 shadow-[0_18px_45px_rgba(6,10,20,0.45)] text-sm leading-relaxed';

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
      <div className="absolute left-3 top-3 rounded-full border border-border/60 bg-background/60 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.35em] text-primary">
        {language.toUpperCase()}
      </div>
      <button
        type="button"
        onClick={handleCopy}
        className="absolute right-3 top-3 flex items-center gap-1 rounded-full border border-border/60 bg-background/60 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.3em] text-muted-foreground transition hover:border-primary/60 hover:text-primary"
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
                // eslint-disable-next-line @typescript-eslint/no-unused-vars
                const { key: _lineKey, ...lineRest } = lineProps;
                return (
                  <div key={`line-${lineIndex}`} {...lineRest} className="flex">
                    {line.map((token, tokenIndex) => {
                      const tokenProps = getTokenProps({ token, key: tokenIndex });
                      // eslint-disable-next-line @typescript-eslint/no-unused-vars
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
      className="break-words rounded-md border border-primary/25 bg-primary/10 px-1.5 py-0.5 font-mono text-[13px] font-semibold leading-6 text-foreground shadow-inner shadow-primary/10"
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
        <div className="relative overflow-hidden rounded-[32px] border border-border/60 bg-card/80 shadow-[0_24px_60px_rgba(6,10,20,0.55)] transition hover:-translate-y-1.5 hover:shadow-[0_30px_50px_rgba(6,10,20,0.7)]">
          <Image
            src={src}
            alt={alt ?? 'Illustration'}
            title={title}
            width={1600}
            height={900}
            sizes="(max-width: 768px) 100vw, 800px"
            className="w-full max-h-[70vh] object-contain transition duration-300 group-hover:scale-105 md:max-h-[80vh]"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-background/60 opacity-0 transition group-hover:opacity-100" />
        </div>
      </Link>
      {(alt || title) && (
        <figcaption className="mt-3 text-xs uppercase tracking-[0.4em] text-muted-foreground">
          {alt ?? title}
        </figcaption>
      )}
    </figure>
  );
}

function BlockQuote(props: { children: ReactNode }) {
  return (
    <blockquote className="rounded-2xl border-l-4 border-primary/70 bg-primary/10 p-5 text-base leading-relaxed text-foreground shadow-[0_14px_32px_rgba(6,10,20,0.4)]">
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
    <div className="relative overflow-hidden rounded-2xl border border-border/60 bg-card/80 shadow-[0_24px_60px_rgba(6,10,20,0.45)]">
      {/* eslint-disable-next-line sonarjs/table-header */}
      <table className="min-w-full divide-y divide-border/60 bg-background/40" {...props} />
    </div>
  ),
  thead: (props: { children: ReactNode }) => (
    <thead className="bg-background/80 text-xs uppercase tracking-[0.28em] text-muted-foreground" {...props} />
  ),
  th: (props: { children: ReactNode }) => (
    <th className="border-b border-border/60 px-4 py-3 text-left text-sm font-semibold text-foreground" {...props} />
  ),
  td: (props: { children: ReactNode }) => (
    <td className="border-b border-border/60 px-4 py-3 text-sm text-muted-foreground" {...props} />
  ),
  ul: (props: { children: ReactNode }) => (
    <ul className="space-y-2 pl-5 text-sm text-muted-foreground marker:text-primary/80" {...props} />
  ),
  ol: (props: { children: ReactNode }) => (
    <ol className="space-y-2 pl-5 text-sm text-muted-foreground" {...props} />
  ),
  li: (props: { children: ReactNode }) => <li className="leading-relaxed" {...props} />,
};

export { components };
