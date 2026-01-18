"use client";

import { ClipboardDocumentIcon, ClipboardDocumentCheckIcon } from '@heroicons/react/24/outline';
import Highlight, { defaultProps, type Language, type PrismTheme } from 'prism-react-renderer';
import { useState, type ReactNode } from 'react';

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

export function CodeBlock({ children }: { children: ReactNode }) {
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
        className="absolute right-3 top-3 flex min-h-8 items-center gap-1 rounded-full border border-border/60 bg-background/60 px-3 py-1.5 text-[11px] font-semibold uppercase tracking-[0.3em] text-muted-foreground transition-colors hover:border-primary/60 hover:text-primary"
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
