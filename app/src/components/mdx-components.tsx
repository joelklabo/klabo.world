"use client";

import { ClipboardDocumentIcon, ClipboardDocumentCheckIcon } from '@heroicons/react/24/outline';
import Highlight, { defaultProps, type Language } from 'prism-react-renderer';
import theme from 'prism-react-renderer/themes/nightOwl';
import Link from 'next/link';
import { useState, type ReactNode } from 'react';

const baseCodeStyles =
  'relative mt-4 rounded-2xl border border-slate-800/70 bg-slate-950/80 p-4 shadow-[0_20px_45px_rgba(2,6,23,0.85)] text-sm leading-relaxed';

function CodeBlock({ children }: { children: ReactNode }) {
  const child = Array.isArray(children) ? children[0] : children;
  const code = typeof child === 'string' ? child : typeof child?.props?.children === 'string' ? child.props.children : '';
  const className = typeof child?.props?.className === 'string' ? child.props.className : '';
  const languageMatch = className.match(/language-(\w+)/);
  const language = (languageMatch?.[1] ?? 'tsx') as Language;
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!code) return;
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  const trimmedCode = code.trimEnd();

  return (
    <div className={`${baseCodeStyles} relative`}>
      <div className="absolute right-3 top-3 flex items-center gap-1 text-[13px] uppercase tracking-[0.4em] text-slate-400">
        <span>{language.toUpperCase()}</span>
        <button
          type="button"
          onClick={handleCopy}
          className="flex items-center gap-1 rounded-full border border-white/10 bg-white/5 px-2 py-1 text-[11px] text-slate-100 transition hover:border-white/30"
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
      </div>
      <Highlight {...defaultProps} code={trimmedCode} language={language} theme={theme}>
        {({ className, style, tokens, getLineProps, getTokenProps }) => (
          <pre className="overflow-x-auto rounded-xl" aria-label={`Code snippet (${language})`}>
            <code className={className} style={{ ...style, paddingTop: '1.5rem' }}>
              {tokens.map((line, lineIndex) => {
                const lineProps = getLineProps({ line, key: lineIndex });
                const { key: lineKey, ...lineRest } = lineProps;
                void lineKey;
                return (
                  <div key={`line-${lineIndex}`} {...lineRest} className="flex">
                    {line.map((token, tokenIndex) => {
                      const tokenProps = getTokenProps({ token, key: tokenIndex });
                      const { key: tokenKey, ...tokenRest } = tokenProps;
                      void tokenKey;
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
    <code className="rounded bg-slate-800 px-1 py-0.5 font-mono text-xs font-semibold tracking-wide text-indigo-100" {...props} />
  );
}

function ProseImage(props: { src?: string | null; alt?: string; title?: string }) {
  const { src, alt, title } = props;
  if (!src) {
    return null;
  }
  return (
    <figure className="group relative my-10">
      <Link href={src} target="_blank" rel="noreferrer" className="pointer-events-auto">
        <div className="relative overflow-hidden rounded-[32px] border border-white/10 bg-gradient-to-b from-slate-900 via-slate-950 to-black shadow-2xl shadow-black/60 transition hover:-translate-y-1.5 hover:shadow-[0_30px_50px_rgba(2,6,23,0.75)]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={src} alt={alt ?? 'Illustration'} title={title} className="w-full object-cover transition duration-300 group-hover:scale-105" />
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
    <blockquote className="rounded-2xl border border-cyan-500/40 bg-cyan-500/5 p-5 text-base italic leading-relaxed text-cyan-100 before:content-['“']">
      {props.children}
    </blockquote>
  );
}

const components = {
  pre: ({ children }: { children: ReactNode }) => <CodeBlock>{children}</CodeBlock>,
  code: InlineCode,
  img: ProseImage,
  blockquote: BlockQuote,
  table: (props: { children: ReactNode }) => (
    <div className="relative overflow-hidden rounded-2xl border border-white/5 bg-slate-900/60 shadow-xl shadow-black/40">
      <table className="min-w-full divide-y divide-slate-800 bg-slate-950/80" {...props} />
    </div>
  ),
  thead: (props: { children: ReactNode }) => (
    <thead className="bg-slate-900/70 text-xs uppercase tracking-[0.3em] text-slate-300" {...props} />
  ),
  th: (props: { children: ReactNode }) => (
    <th className="border-b border-slate-800 px-4 py-3 text-left font-semibold text-sm" {...props} />
  ),
  td: (props: { children: ReactNode }) => (
    <td className="border-b border-slate-900 px-4 py-3 text-sm text-slate-200" {...props} />
  ),
  ul: (props: { children: ReactNode }) => (
    <ul className="space-y-2 pl-5 text-sm text-slate-200" {...props} />
  ),
  ol: (props: { children: ReactNode }) => (
    <ol className="space-y-2 pl-5 text-sm text-slate-200" {...props} />
  ),
  li: (props: { children: ReactNode }) => <li className="leading-relaxed" {...props} />,
};

export { components };
