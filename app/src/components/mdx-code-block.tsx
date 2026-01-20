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
  'relative mt-4 max-w-full rounded-xl border border-border/20 bg-card/40 px-4 pb-3 pt-9 text-sm leading-relaxed';

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
      <div className="absolute left-4 top-3 text-[10px] font-semibold uppercase tracking-[0.28em] text-muted-foreground/80">
        {language.toUpperCase()}
      </div>
      <button
        type="button"
        onClick={handleCopy}
        aria-label={copied ? 'Copied to clipboard' : 'Copy code to clipboard'}
        className="absolute right-3 top-2.5 inline-flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground/80 motion-safe:transition-colors hover:bg-background/30 hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/50"
      >
        {copied ? (
          <ClipboardDocumentCheckIcon className="h-4 w-4" aria-hidden="true" />
        ) : (
          <ClipboardDocumentIcon className="h-4 w-4" aria-hidden="true" />
        )}
      </button>
      <Highlight {...defaultProps} code={trimmedCode} language={language} theme={warmPrismTheme}>
        {({ className, style, tokens, getLineProps, getTokenProps }) => (
          <pre className="mt-2 max-w-full overflow-x-auto rounded-lg bg-transparent" aria-label={`Code snippet (${language})`}>
            <code className={className} style={{ ...style, paddingTop: '0.25rem' }}>
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
